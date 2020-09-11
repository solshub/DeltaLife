const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, args, p, conn, user, player}) => {
		const cmdRename = `\`${p}rename\``;
		const cmdActive = `\`${p}active\``;
		const cmdProfile = `\`${p}profile\``;
		const cmdAge = `\`${p}age\``;
		

		const name = args.join(' ');
		if(name.length > 17) return message.reply('I\'m sorry, that name is too long.');
		const problem = await getPlayers();
		if(problem) return;

		async function getPlayers() {
			const promise = new Promise((resolve, reject) => { getPlayers(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			if(result == 'alreadyused') {
				await message.reply(`I\'m sorry, you already got a character named ${name}! ` +
				'Please choose a different name.');
				return true; }

			function getPlayers(resolve, reject) {
				conn.query(`SELECT name FROM player WHERE alive = true AND user = ${user.id}`, function(error, results, fields) {
					if(error) throw error;

					if(results.length)
					if(results.some(r => r.name == name))
						return resolve('alreadyused');

					return resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}


		let rerolls = user.rerolls;

		let preMsg;
		const content = [', or with `🔄` to reroll and generate something new. **You have ',
			` rerolls left** (they are hard to get).`];
		
		let z = client.data.get('zodiac', user.zodiac);
		z = `${z.zodiac} ${z.symbol}`;
		let profile = {
			color: process.env.CLR_WARN,
			author: { 
				name: `${name}'s birth certificate`,
				icon_url: message.author.avatarURL
			},
			footer: { text: `Zodiac: ${z} (set per user)\nTime of birth` }
		};

		let msg, attributes, react, last;

		const promise = new Promise((resolve, reject) => { approveProfile(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		if(result == 'exit') return;
		if(result == 'outrerolls') return message.channel
			.send('I\'m sorry. You are out of rerolls. ' +
				'Try playing and you\'ll get more.');

		async function approveProfile(resolve, reject) {
			let firstTime = true;
			do {
				attributes = await generate();
				if(attributes == 'outrerolls') return resolve('outrerolls');
				react = await waitReaction();
			} while([react].includes('repeat'));
			resolve(react);
			
			async function generate() {
				last = await getLast();
				if(!last && !rerolls) return 'outrerolls';
				if(rerolls && !firstTime) await updateRerolls();
				else if(player) await updateRerolls();

				async function updateRerolls() {
					rerolls--;
		
					const promise = new Promise((resolve, reject) => { updateRerolls(resolve, reject); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					await promise;
		
					function updateRerolls(resolve, reject) {
						conn.query(`UPDATE user SET rerolls = ${rerolls} WHERE id = ${user.id}`,
						function(error, results, fields) {
							if(error) throw error;
							rerolled = true;
							resolve();
						}).on('error', err => { sqlHandle(err); });
					}
				}
				

				let advice = 'React with `👍` to choose, `👎` to exit';
				if(rerolls) advice += content[0] + rerolls + content[1];
				else advice += '. **You are out of rerolls.**';
				advice += ` After creation, you can always ${cmdRename}.`;

				if(!preMsg) await message.channel.send(advice).then(m => preMsg = m);
				else await preMsg.edit(advice).then(m => preMsg = m);


				let gender, country, health, looks, smarts;				
				if(rerolls && !firstTime) generate();
				else { generate(last); }
	
				function generate(last) {
					if(last) gender = last.gender;
					else { if(chance.bool({likelihood: 1})) gender = 0;
						else gender = chance.pickone([1, 2]); }
					let g = client.data.get('gender', gender);
					g = `${g.gender} ${g.symbol}`;
	
					if(last) country = last.country;
					else country = chance.pickone(Object.keys(client.data.get('country', null)));
					let c = client.data.get('country', country);
					c = `${c.country} ${c.flag}`;

					if(last) {
						health = last.health;
						looks = last.looks;
						smarts = last.smarts;
					} else {
						health = chance.integer({ min: 35, max: 100 });
						if(user.zodiac == 4) looks = chance.integer({ min: 40, max: 100 });
						else looks = chance.integer({ min: 20, max: 100 });
						if(user.zodiac == 2) smarts = chance.integer({ min: 40, max: 100 });
						else smarts = chance.integer({ min: 20, max: 100 });
					}
					
					profile.description = `A **${g}** from **${c}**`;
					profile.fields = [
						{ name: '**Health**', value: `\`${health}/100 ${process.env.EMT_HEALTH}\``, inline: true },
						{ name: '**Appearance**', value: `\`${looks}/100 ${process.env.EMT_LOOKS}\``, inline: true },
						{ name: '**Smartness**', value: `\`${smarts}/100 ${process.env.EMT_SMARTS}\``, inline: true }
					];
					profile.timestamp = new Date();
				}

	
				if(msg) await msg.edit({embed: profile}).then(m => msg = m);
				else await message.channel.send({embed: profile}).then(m => msg = m);

				
				await checkLast();

				async function checkLast() {
					if(last) {
						const promiseA = new Promise((resolve, reject) => { updateLast(resolve, reject); })
						.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
						await promiseA;
						last = await getLast();
					} else {
						const promiseB = new Promise((resolve, reject) => { insertLast(resolve, reject); })
						.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
						await promiseB;
						last = await getLast();
						checkLast();
					}

					function updateLast(resolve, reject) {
						conn.query(`UPDATE reroll SET gender = ${gender}, country = ${country}, `+
						`health = ${health}, looks = ${looks}, smarts = ${smarts} `+
						`WHERE user = ${user.id}`, function(error, results, fields) {
							if(error) throw error;
							resolve();
						}).on('error', err => { sqlHandle(err); });
					}

					function insertLast(resolve, reject) {
						conn.query('INSERT INTO reroll(user, gender, country, health, looks, smarts) ' +
						`VALUES (${user.id}, ${gender}, ${country}, ${health}, ${looks}, ${smarts})`,
						function(error, results, fields) {
							if(error) throw error;
							resolve();
						}).on('error', err => { sqlHandle(err); });
					}
				}

				firstTime = false;
				return { gender, country, health, looks, smarts };
			}
	
			async function waitReaction() {
				let filters = [];
				await msg.react(process.env.EMT_ALLOW).then(() => filters.push(process.env.EMT_ALLOW));
				await msg.react(process.env.EMT_DENY).then(() => filters.push(process.env.EMT_DENY));
				if(rerolls) await msg.react(process.env.EMT_REROLL).then(() => filters.push(process.env.EMT_REROLL));
				const filter = (reaction, user) => { return filters.includes(reaction.emoji.name) && user.id === message.author.id; };	

				const promise = new Promise((res, rej) => { waitReaction(res, rej); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				const result = await promise;
				return result;

				function waitReaction(resolve, reject) {
					msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
					.then(async collected => {
						const reaction = collected.first();
						switch(reaction.emoji.name) {
							case process.env.EMT_ALLOW:
								return resolve();
							case process.env.EMT_REROLL:
								msg.clearReactions();
								return resolve('repeat');
							default:
								return exit('I see, character creation canceled.');
						}
					})
					.catch(() => exit('I\'m sorry, it took too long for any reaction.'));
		
					async function exit(a) {
						await message.reply(a).then(reply => {
							preMsg.delete(100);
							msg.delete(100);
							reply.delete(10000);
							message.delete(10000);
						});
						resolve('exit');
					}
				}
			}
		}

		
		if(last) deleteLast();
		let doneMsg = `${name} was just born`;
		if(player) await updateActive();
		const sickMessage = await insertPlayer(attributes);

		async function deleteLast() {
			const promise = new Promise((resolve, reject) => { deleteLast(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;
			last = await getLast();

			function deleteLast(resolve, reject) {
				conn.query(`DELETE FROM reroll WHERE user = ${user.id}`,
				function(error, results, fields) {
					if(error) throw error;
					resolve();	
				}).on('error', err => { sqlHandle(err); });
			}
		}

		async function updateActive() {
			doneMsg += ` and is your \`${cmdActive}\` character now`;

			const promise = new Promise((resolve, reject) => { updateActive(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateActive(resolve, reject) {
				conn.query(`UPDATE player SET active = false WHERE id = ${player.id}`,
				function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}

		async function insertPlayer(values) {
			const promiseA = new Promise((resolve, reject) => { insertPlayer(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const id = await promiseA;

			function insertPlayer(resolve, reject) {
				conn.query('INSERT INTO player(user, gender, country, name, health, smarts, looks)' +
					`VALUES (${user.id}, ${values.gender}, ${values.country}, '${name}',`+
					`${values.health}, ${values.looks}, ${values.smarts})`,
				function(error, results, fields) {
					if(error) throw error;
					resolve(results.insertId);
				}).on('error', err => { sqlHandle(err); });
			}


			const promiseB = new Promise((resolve, reject) => { insertDegree(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseB;

			function insertDegree(resolve, reject) {	
				conn.query(`INSERT INTO degree(player) VALUES (${id})`, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}


			const promiseC = new Promise((resolve, reject) => { insertJob(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseC;

			function insertJob(resolve, reject) {	
				conn.query(`INSERT INTO job(player) VALUES (${id})`, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}


			if(!chance.bool({ likelihood: 25 })) return;

			const diseases = Object.values(client.data.get('sick'));
			const bornDiseases = diseases.filter(d => d.risk && d.risk.born);
			if(!bornDiseases.length) return;
			const disease = chance.pickone(bornDiseases); 
			const sick = diseases.findIndex(d => d.sick == disease.sick);			

			const promiseD = new Promise((resolve, reject) => { insertSick(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseD;

			function insertSick(resolve, reject) {	
				conn.query(`INSERT INTO sick(sick, player) VALUES (${sick}, ${id})`, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
			
			return `Your character was diagnosed with ${disease.sick} at birth.`;
		}

		
		doneMsg += `! You can now check your full ${cmdProfile}, or ${cmdAge}.`;
		if(sickMessage) doneMsg += `\n${sickMessage}`;
		await preMsg.delete(100);
		await msg.clearReactions();
		await message.channel.send(doneMsg);


		if(user.zodiac == 4 || user.zodiac == 2) {
			const zodiac = client.data.get('zodiac', user.zodiac);
			message.channel.send(`Looks like your zodiac ${zodiac.symbol} gave you that high ${(user.zodiac == 4) ? 'looks' : 'smarts'}!`);
		}


		client.commands.get('achievs').run({ client, message, conn, user, achiev: 'creates' });


		async function getLast() {
			const promise = new Promise((resolve, reject) => { getLast(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function getLast(resolve, reject) {
				conn.query(`SELECT gender, country, health, looks, smarts FROM reroll WHERE user = ${user.id}`,
				function(error, results, fields) {
					if(error) throw error;
					resolve(results[0]);
				}).on('error', err => { sqlHandle(err); });
			}
		}


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------');
			console.log(`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}
	},

	config: {
		requireArgs: true,
		mayPlayer: true
	},
	
	get help() {
		return {
			name: 'create',
			aliases: ['creating'],
			category: 'Character',
			description: 'Start a new life.',
			usage: 'create [character-name]'
		};
	}
};