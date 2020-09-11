const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, args, p, conn, user, player}) => {
		let embed = {
			color: process.env.CLR_ACT_POS,
			author: {
				name: `${firstWord(player.name)} aged up!`,
				icon_url: message.author.avatarURL
			},
			description: '1 entire year has passed...',
			fields: []
		};


		let result = await updatePlayer();
		if(result == 'death') return;

		async function updatePlayer() {
			let playerStr = `Happy birthday! You\'re ${player.age}-years-old now.`;

			const promiseA = new Promise((resolve, reject)=> { updateAge(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			playerStr += await promiseA;

			async function updateAge(resolve, reject) {
				player.age++;

				let statsStr = '';
				['happy', 'social', 'health', 'looks', 'smarts'].forEach(a => {
					const val = calcNear(0);
					player[a] = calcMaxMin(player[a] + val);
					statsStr += `${(val >= 0) ? '+' : ''}${val} ${a} `;
					if(a == 'social') statsStr += `\`\n\``;
				});

				const promise = new Promise((res, rej) => { updatePlayer(res, rej); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promise;

				function updatePlayer(resolve, reject) {
					let query = `UPDATE player SET age = ${player.age}, ` +
						`happy = ${player.happy}, social = ${player.social}, health = ${player.health}, ` +
						`smarts = ${player.smarts}, looks = ${player.looks} ` +
						`WHERE id = ${player.id}`;
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
						resolve();
					}).on('error', err => { sqlHandle(err); });
				}


				await client.commands.get('achievs')
				.run({ client, message, args, p, conn, user, achiev: 'years' });

				
				resolve(`\n\`${statsStr}\``);
			}

			if(playerStr) embed.description += '\n' + playerStr;


			let prob = 0;
			if(player.age > 50) prob += 5;
			if(player.age > 70) prob += 5;
			if(player.age > 90) prob += 5;			
			if(prob && chance.bool({ likelihood: prob })) {
				await message.reply('1 entire years has passed, and...');
				await client.commands.get('death')
				.run({client, message, conn, user, player, cause: `of natural causes`});
				return 'death'; }
				

			let relationStr = '';

			if(chance.bool({likelihood: 50 })) {
				const promiseB = new Promise((resolve, reject) => { updateRelation(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promiseB; }

			async function updateRelation(resolve, reject) {
				let query = `SELECT id, friend, love, title FROM relation WHERE userA = ${user.id} OR userB = ${user.id}`;
				conn.query(query, async function(error, results, fields) {
					if(error) throw error;

					if(!results.length) return resolve();
					relationStr = wordsPerLine('You feel like you\'ve got a little bit distant from your friends...');

					for(let relation of results) {
						const promise = new Promise((res, rej) => { updateRelation(res, rej, relation); })
						.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
						await promise;
					}

					resolve();
				})
				
				function updateRelation(resolve, reject, r) {
					const limits = [{ max: 100, min: -100 }, { max: 100, min: 0 }];
					const values = calcChange(false, r.friend, r.love, 5, limits);
					r.friend = values[0];
					r.love = values[1];

					function calcChange(add, a, b, val, limits = [], both = true) {
						let c, d;
						if(limits.length == 1) limits[1] = limits[0];
			
						if(add) {
							if(both) {
								c = calcMaxMin(a + val, limits[0]);
								d = calcMaxMin(b + val, limits[1]);
							} else c = calcMaxMin(a + val, limits[0]);
						} else {
							if(both) {
								c = calcMaxMin(a - val, limits[0]);
								d = calcMaxMin(b - val, limits[1]);
							} else c = calcMaxMin(a - val, limits[0]);
						}
						return [c, d];
			
						function calcMaxMin(a, b = {}) {
							if(a > b.max) return b.max;
							if(a < b.min) return b.min;
							return a;
						}
					}


					let query = `UPDATE relation SET friend = ${r.friend}, ` +
						`love = ${r.love} WHERE id = ${r.id}`;					
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
						resolve();
					}).on('error', err => { sqlHandle(err); });				
				}
			}

			if(relationStr) embed.description += '\n' + relationStr;


			let medicalStr = '';

			const promiseC = new Promise((resolve, reject)=> { updateSick(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promiseC;
			if(result) return result;

			async function updateSick(resolve, reject) {
				let sicks = await getSick();

				async function getSick() {
					const promise = new Promise((res, rej) => { getSick(res, rej); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					const result = await promise;
					return result;

					function getSick(resolve, reject) {
						let query = `SELECT id, sick FROM sick WHERE player = ${player.id}`;
						conn.query(query, function(error, results, fields) {
							if(error) throw error;
							resolve(results);
						}).on('error', err => { sqlHandle(err); });
					}
				}


				if(sicks.length) {
					const remove = [];
					for(let s of sicks) {
						const sick = client.data.get('sick', s.sick);

						if((sick.effect && sick.cure.vanish && chance.bool({ likelihood: sick.cure.vanish })) ||
						sick.risk.age.max && player.age > sick.risk.age.max) {
							if(medicalStr) medicalStr += '\n';
							medicalStr += await cureSick(s.id, sick.sick);
							remove.push(s.id);
						}
					}

					sicks = sicks.filter(s => !remove.includes(s.id));
				}

				async function cureSick(id, name) {
					await client.commands.get('achievs')
					.run({client, message, conn, user, player, achiev: 'treated'});


					const promise = new Promise((res, rej) => { cureSick(res, rej); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					await promise;

					function cureSick(resolve, reject){
						const query = `DELETE FROM sick WHERE id = ${id}`;
						conn.query(query, function(error, results, fields) {
							if(error) throw error;
							resolve();
						}).on('error', err => { sqlHandle(err); });
					}


					return `You got cured of ${name}!`;
				}


				if(sicks.length) {
					for(let s of sicks) {
						const sick = client.data.get('sick', s.sick);
						if(!sick.effect) return;

						if(sick.effect.letal)
						if(chance.bool({ likelihood: sick.effect.letal })) {
							await message.reply('1 entire years has passed, and...');
							await client.commands.get('death')
							.run({client, message, conn, user, player, cause: `of ${sick.sick}`});
							return resolve('death'); }

						if(sick.effect.stat.length && sick.effect.val.length &&
						sick.effect.stat.length == sick.effect.val.length) {
							let statsStr = '';

							for(let i = 0; i < sick.effect.stat.length; i++) {
								const stat = sick.effect.stat[i];
								const val = calcNear(sick.effect.val[i], 3);

								if(statsStr && i == 2 && (i + 1) !== sick.effect.stat.length)
									statsStr += '\n';
								statsStr += await updatePlayer(stat, val);
							}

							if(statsStr) {
								if(medicalStr) medicalStr += '\n';
								medicalStr += `${sick.sick} took...\n\`${statsStr}\``; }
						}
					}
				}

				async function updatePlayer(stat, val) {
					player[stat] = calcMaxMin(player[stat] + val);

					const promise = new Promise((res, rej) => { updatePlayer(res, rej); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					await promise;

					function updatePlayer(resolve, reject) {
						let query = `UPDATE player SET ${stat} = ${player[stat]} WHERE id = ${player.id}`;
						conn.query(query, function(error, results, fields) {
							if(error) throw error;
							resolve();
						}).on('error', err => { sqlHandle(err); });
					}


					return `${val} ${stat} `;
				}

				
				let prob = (player.age <= 20) ? player.age : ((player.age >= 50) ? 40 : 20);
				prob += (player.age < 10) ? 20 : ((player.age < 30) ? 10 : 0);
				if(chance.bool({ likelihood: prob }) && sicks.length < 3) await insertSick();

				async function insertSick() {
					let diseases = client.data.get('sick')
					chanceDiseases = Object.values(diseases).filter(s => s.risk && s.risk.chance);

					const oldDiseases = Object.values(diseases).filter(s => s.risk && s.risk.old);
					if(player.age >= 50) chanceDiseases.concat(oldDiseases);

					const statsDiseases = {};
					['happy', 'social', 'health', 'smarts', 'looks'].forEach(a => {
						statsDiseases[a] = Object.values(diseases).filter(s =>
							s.risk && (s.risk.low == a || (Array.isArray(s.risk.low) && s.risk.low.includes(a))));
						if(statsDiseases[a].length) if(player[a] <= 30)
							chanceDiseases.concat(statsDiseases[a]);
					});
					
					if(!chanceDiseases.length) return;


					let disease;
					do {
						disease = chance.pickone(chanceDiseases);
					} while(disease.risk && disease.risk.age && (disease.risk.age.min || disease.risk.age.max) &&
					((!disease.risk.age.min || player.age < disease.risk.age.min) ||
					(!disease.risk.age.max || player.age > disease.risk.age.max)))

					const index = Object.values(diseases).findIndex(d => d.sick == disease.sick);

					if(medicalStr) medicalStr += '\n';
					medicalStr += await insertSick(index, disease.sick);		
					sicks.push(index);
	
					async function insertSick(disease, name) {
						await client.commands.get('achievs')
						.run({client, message, conn, user, player, achiev: 'sick'});
	
	
						const promise = new Promise((res, rej) => { insertSick(res, rej); })
						.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
						await promise;
	
						function insertSick(resolve, reject) {
							let query = `INSERT INTO sick(player, sick) VALUES (${player.id}, ${disease})`;
							conn.query(query, function(error, results, fields) {
								if(error) throw error;
								resolve();
							}).on('error', err => { sqlHandle(err); });
						}
	
	
						return `**You're diagnosed with ${name}**`;
					}
				}


				resolve();
			}

			if(medicalStr) embed.fields.push({ name: '**Medical situation**', value: medicalStr });


			let monetaryStr = '';

			const promiseD = new Promise((resolve, reject)=> { checkMonetary(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseD;

			async function checkMonetary(resolve, reject) {
				let debt = 0.00;


				if(player.degree.loan && player.degree.paidin) {
					debt += player.degree.loan;
					player.degree.paidin--;
					monetaryStr += `-$${parseFloat(player.degree.loan).toFixed2} to pay your student loan`;
					if(player.degree.paidin == 0) {
						player.degree.loan = 0.00;
						monetaryStr += '\nYou\'re done paying your student loan!' };
					
					const promiseA = new Promise((res, rej) => { updateDegree(res, rej); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					await promiseA;
				}

				function updateDegree(resolve, reject) {
					let query = `UPDATE degree SET loan = ${parseFloat(playre.degree.loan)}, ` +
						`paidin = ${player.degree.paidin} WHERE id = ${player.id}`;
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
						resolve();					
					}).on('error', err => { sqlHandle(err); });
				}


				for(let a of [['cars', 'car'], ['houses', 'house']]) {
					let tempDebt = 0.00;
					let done = 0, doneStr = '';
					if(player[a[0]] && player[a[0]].length) {
						player[a[0]].forEach(c => {
							// in order to assure the count (filter.length) is correct,
							// only paidin is changed during iteration
							// loan is only changed after its done, so use it to count loans
							if(!c.loan || !c.paidin) return;
							tempDebt += c.loan;
							c.paidin--;
							if(c.paidin == 0) {
								done++;
								if(doneStr) doneStr +='\n';
								if(player[a[0]].filter(c => c.loan).length > 1) doneStr = `You\'re done paying ${done} of ` +
									`${player[a[0]].filter(c => c.loan).length} ${a[1]} loans!`;
								else doneStr = `You\'re done paying your ${a[1]} loan!`; }
						});
					}

					if(tempDebt) {
						if(monetaryStr) monetaryStr += '\n';
						monetaryStr += `-$${parseFloat(tempDebt).toFixed(2)} to pay your ${a[1]} loan${(player.cars.filter(c => c.loan).length > 1) ? 's' : ''}`;				
						debt += tempDebt;
						if(doneStr) monetaryStr += '\n' + doneStr;
	
						player[a[0]].filter(c => c.paidin == 0).forEach(c => { c.loan = 0.00; });
	
						for(let c of player[a[0]]) {
							const promiseB = new Promise((res, rej) => { updateCarHouse(res, rej, c, a[1]); })
							.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
							await promiseB;
						}
					};
				}

				function updateCarHouse(resolve, reject, a, b) {
					let query = `UPDATE ${b} SET loan = ${parseFloat(a.loan).toFixed(2)}, ` +
						`paidin = ${a.paidin} WHERE id = ${a.id}`;
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
						resolve();					
					}).on('error', err => { sqlHandle(err); });
				}


				let children = [];
				if(player.children.others.length) children = children.concat(player.children.others);
				if(player.children.male.length) children = children.concat(player.children.male);
				if(player.children.female.length) children = children.concat(player.children.female);

				let childDebt = 0.00;
				if(children && children.length) {
					children.forEach(c => { childDebt += c.cost; }); }

				if(childDebt) {
					if(monetaryStr) monetaryStr += '\n';
					monetaryStr += `-$${parseFloat(childDebt).toFixed(2)} ` +
						`spent with your ${(children.length > 1) ? `${children.length} children` : 'child'}!`;
					debt += childDebt; }

				
				player.cash -= debt;

				const promiseC = new Promise((res, rej) => { updatePlayer(res, rej); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promiseC;

				function updatePlayer(resolve, reject) {
					let query = `UPDATE player SET cash = ${parseFloat(player.cash).toFixed(2)} WHERE id = ${player.id}`;
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
						resolve();					
					}).on('error', err => { sqlHandle(err); });
				}
				

				resolve();
			}

			if(monetaryStr) embed.fields.push({ name: '**Monetary situation**', value: monetaryStr });

			
			let jobDegreeStr = '';

			const promiseE = new Promise((resolve, reject)=> { updateJobDegree(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseE;

			async function updateJobDegree(resolve, reject) {
				if(!player.dropped) await updateDegree();

				async function updateDegree() {
					player.degree.years += 1;
		
					switch(player.degree.degree) {
						case 0:
							if(player.age == 5) {
								if(jobDegreeStr) jobDegreeStr += '\n';
								jobDegreeStr += 'You just joined kindergarden!';
								player.degree.degree = 1; }
							break;
						case 1:
							if(player.age == 7) {
								if(jobDegreeStr) jobDegreeStr += '\n';
								jobDegreeStr += 'You\'re out of kindergarden' +
									'\nYou just joined elementary school!';
								player.degree.degree = 2; }
							break;
						case 2:
							if(player.age == 11) {
								if(jobDegreeStr) jobDegreeStr += '\n';
								jobDegreeStr += 'You\'re out of elementary' +
									'\nYou just joined middle school!'
								player.degree.degree = 3; }
							break;
						case 3:
							if(player.age == 15) {
								if(jobDegreeStr) jobDegreeStr += '\n';
								jobDegreeStr += 'You\'re out of middle school' +
									'\nYou\'re in high school now!'
								player.degree.degree = 4; }
							break;
						case 4:
							if(player.age == 18) {
								if(jobDegreeStr) jobDegreeStr += '\n';
								jobDegreeStr += 'You completed high school' +
									'\nYou\'re not in school anymore!'
								player.degree.degree = 4; }
							break;
						default:
							if(player.degree.years == 6) {
								const degree = client.data.get('degree', player.degree.degree);
								if(jobDegreeStr) jobDegreeStr += '\n';
								jobDegreeStr += 'You completed university!' +
									`\nYou earned a degree in ${degree.msg}` }
							break;
					}

					if(player.degree.degree > 0 && (player.degree.degree <= 4 || player.degree.years <= 5)) {
						const degree = client.data.get('degree', player.degree.degree);
						if(jobDegreeStr) jobDegreeStr += '\n';
						jobDegreeStr += `You\'re a grade ${player.degree.grade} ${degree.msg} student`; }
		
					const promiseA = new Promise((res, rej) => { updateDegree(res, rej); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					await promiseA;				
		
					function updateDegree(resolve, reject) {
						let query = `UPDATE degree SET degree = ${player.degree.degree}, ` +
							`years = ${player.degree.years} WHERE player = ${player.id}`;
						conn.query(query, function(error, results, fields) {
							if(error) throw error;
							resolve();					
						}).on('error', err => { sqlHandle(err); });
					}
				}


				if(!player.retired && player.job.job > 0) await updateJob();

				async function updateJob() {
					player.job.years += 1;
					player.job.score = calcMaxMin(player.job.score - 5);
	
					const promiseB = new Promise((res, rej) => { updateJob(res, rej); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					await promiseB;
				
	
					let salary = parseFloat(player.job.salary * 12).toFixed(2);
					if(player.zodiac == 1) salary *= 1.15;
					player.cash += salary;
	
					const promiseC = new Promise((res, rej) => { receiveSalary(res, rej); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });				
					await promiseC;
	
	
					const job = client.data.get('job', player.job.job);
	
					jobDegreeStr += wordsPerLine(`+$${salary} for 12 months working as a ` +
						`${job.ranks[player.job.rank].msg}, you've following the ${job.job} `+
						`career for ${player.job.years} years now.`);				
	
					if(player.zodiac == 1) {
						const zodiac = client.data.get('zodiac', player.zodiac);
						jobDegreeStr += `\nHigher salary for your hard work! ${zodiac.symbol}`; }	
	
					function updateJob(resolve, reject) {
						let query = `UPDATE job SET years = ${player.job.years}, ` +
							`score = ${player.job.score} WHERE player = ${player.id}`;
						conn.query(query, function(error, results, fields) {
							if(error) throw error;
							resolve();					
						}).on('error', err => { sqlHandle(err); });
					}
		
					function receiveSalary(resolve, reject) {
						let query = `UPDATE player SET cash = ${parseFloat(player.cash).toFixed(2)} WHERE id = ${player.id}`;
						conn.query(query, function(error, results, fields) {
							if(error) throw error;
							resolve();
						}).on('error', err => { sqlHandle(err); });
					}
				}


				resolve();
			}

			if(jobDegreeStr) embed.fields.push({ name: '**Work & Education**', value: jobDegreeStr });


			let zodiacStr = '';

			const promiseF = new Promise((resolve, reject)=> { checkZodiac(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseF;

			async function checkZodiac(resolve, reject) {
				let val, str;
				if(player.zodiac == 3 && player.married) {
					val = 5; str = '\'re happy being married'; }
				if(player.zodiac == 5 && (player.degree > 4 && player.years > 5)) {
					val = 5; str = '\'ve got a degree'; }
				if(player.zodiac == 8 && player.social >= 60) {
					val = 5; str = '\'re not alone'; }
				if(player.zodiac == 9 && player.social <= 40) {
					val = 5; str = ' like being alone'; }

				if(!val) return resolve();
				player.happy = calcMaxMin(player.happy + val);

				const promise = new Promise((res, rej) => { updatePlayer(res, rej); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promise;				

				function updatePlayer(resolve, reject) {
					let query = `UPDATE player SET happy = ${player.happy} WHERE id = ${player.id}`;
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
						resolve();					
					}).on('error', err => { sqlHandle(err); });
				}


				zodiacStr = `+${val} happy cause you${str}`;
				resolve();
			}

			if(zodiacStr) embed.fields.push({ name: 'Zodiac', value: zodiacStr });


			let yearlyStr = '';

			const promiseG = new Promise((resolve, reject)=> { updateYearly(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseG;

			function updateYearly(resolve, reject) {
				let query = `DELETE FROM yearly WHERE player = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve();					
				}).on('error', err => { sqlHandle(err); });
				

				if(player.degree.degree <= 4) {
					const degrees = [
						player.yearly.degree1,
						player.yearly.degree2,
						player.yearly.degree3,
						player.yearly.degree4,
						player.yearly.degree5
					];

					if(degrees.some(d => d !== 0)) {
						if(yearlyStr) yearlyStr += '\n';
						yearlyStr += 'There might be new degree opportunities' }
				}

				if(player.job.job == 0) {
					const jobs = [
						player.yearly.job1,
						player.yearly.job2,
						player.yearly.job3,
						player.yearly.job4,
						player.yearly.job5,
					];

					if(jobs.some(j => j !== 0)) {
						if(yearlyStr) yearlyStr += '\n';
						yearlyStr += 'There might be new job opportunities' }
				}
			}

			if(yearlyStr) embed.fields.push({ name: '**Opportunities**', value: yearlyStr });
		}

		
		result = await getStats();

		async function getStats() {
			const promise = new Promise((resolve, reject)=> { getStats(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;

			function getStats(resolve, reject) {
				conn.query(`SELECT cash, happy, social, health, smarts, looks FROM player WHERE id = ${player.id}`,
				function(error, results, fields) {
					if(error) throw error;
					Object.entries(results[0]).forEach(r => {
						if((r[0] == 'cash' && parseFloat(r[1]).toFixed(2) !== parseFloat(r[1]).toFixed(2))
						|| (r[0] !== 'cash' && (player[r[0]] !== 0 && player[r[0]] !== 100) && r[1] !== player[r[0]]))
							console.log(`Something went wrong with ${r[0]} calculations ` + r[1] + ` ` + player[r[0]]);
					});
					resolve(results[0]);
				}).on('error', err => { sqlHandle(err); });
			}


			const cash = cashSign(result.cash);

			function cashSign(a) {
				return a >= 0 ? '$' + parseFloat(a).toFixed(2) : '-$' + parseFloat(a * -1).toFixed(2);
			}

			const stats = [
				{ name: '**`Happy ' + process.env.EMT_HAPPY + '`**', value: `${result.happy}/100`, inline: true },
				{ name: '**`Social ' + process.env.EMT_SOCIAL + '`**', value: `${result.social}/100`, inline: true },
				{ name: '\u200b', value: '\u200b', inline: true },
				{ name: '**`Health ' + process.env.EMT_HEALTH + '`**', value: `${result.health}/100`, inline: true },
				{ name: '**`Looks ' + process.env.EMT_LOOKS + '`**', value: `${result.smarts}/100`, inline: true },
				{ name: '**`Smarts ' + process.env.EMT_SMARTS + '`**', value: `${result.looks}/100`, inline: true }
			];


			return { stats, cash };
		}

		const index = embed.fields.findIndex(f => f.name.includes('Monetary'));
		if(index > -1) {
			embed.fields[index].name += process.env.EMT_CASH;
			embed.fields[index].value = `Current bank balance: \`${result.cash}\`\n` + embed.fields[index].value; }
		embed.fields = result.stats.concat(embed.fields);


		await message.channel.send({ embed });


		if(player.preg) {
			const birth = chance.pickone(['boy', 'girl']);
			const pregEmbed = {
				color: process.env.CLR_WARN,
				author: {
					name: `${firstWord(player.name)}'s giving birth!`,
					icon_url: message.author.avatarURL },
				description: wordsPerLine('It\'s finally time! You\'re giving birth! ' +
					`You're feeling so many things at once! It's going to be a ${birth}!`),
			};

			await message.channel.send({ pregEmbed });

			await client.commands.get('pregnant')
			.run({ client, message, args, p, conn, query, user, player, birth });
			
		} else if(chance.bool({ likelihood: 30 }))
			await client.commands.get('random')
			.run({ client, message, args, conn, user, player });
		
		await client.commands.get('timeout')
		.run({client, message, p, conn, user, time: { set: 'age' }});


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function calcMaxMin(a, b = {}) {
			if(typeof b !== 'object') b = { min: 0, max: 100 };
			if(!b.min) b.min = 0; if(!b.max) b.max = 100;

			if(a > b.max) return b.max;
			if(a < b.min) return b.min;
			return a;
		}

		function calcNear(a, b) {
			const val = b || 5;
			const min =	((a - val) < 0 && a > 0) ? 1 : a - val;
			const max = ((a + val) >= 0 && a < 0) ? -1 : a + val;
			return chance.integer({ min, max });
		}
		
		function firstWord(str) {
			const arr = str.split(" ");
			return arr[0];
		}

		function wordsPerLine(a, b) {
			let perLine = 40;
			if(b == 'big') perLine = 50;
			if(b == 'small') perLine = 30;

			let str = [], i = 0;
			let words = a.split(' ');
			words.forEach(word => {
				if(!str[i]) str[i] = '';
				str[i] += word + ' ';

				if(str[i].length > perLine) {
					tmpStr = '';
					words.forEach(w => {
						if(words.indexOf(w) >= words.indexOf(word))
						tmpStr += w + ' '; });

					if(tmpStr.length > Math.round(perLine / 2.5))
					str[i] += '\n'; i++;
				}
			});
			
			str = [].concat.apply([], str);
			return str.join(' ');
		}
	},	

	config: {
		player: true
	},
	
	get help() {
		return {
			name: 'age',
			aliases: ['year'],
			category: 'Action',
			description: 'Make the year go by, age your player up.',
			usage: 'age'
		};
	}
};