module.exports = {
	run: async ({client, message, args, p, conn, user, player, configs = {}}) => {
		if(args.join(' ') === 'short' || args.join(' ') === 'tiny')
		return client.commands.get('stats').run({ client, message, conn, user, player });
		

		let profiles = [];
		const promiseA = new Promise((resolve, reject) => { getPlayers(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });		
		let result = await promiseA;
		if(result !== 'success') return;

		function getPlayers(resolve, reject) {
			conn.query(`SELECT * FROM player WHERE alive = true AND user = ${user.id} ORDER BY active DESC`,
			async function(error, results, fields) {
				if(error) throw error;
				for(let i = 0; i < results.length; i++) {
					const result = await catalogProfiles(results[i]);
					if(result == 'nojobdegree') return reject();
					profiles.push(result);
				}
				resolve('success');
			}).on('error', err => { sqlHandle(err); });

			async function catalogProfiles(player) {
				data = { job: {}, degree: {}, cars: [], houses: [], children: { female: [], male: [], other: [] } };

				let result;
				result = await getData('job');
				if(result == 'nojobdegree') return result;
				else data.job = result;

				result = await getData('degree');
				if(result == 'nojobdegree') return result;
				else data.degree = result;

				data.cars = await getData('car');
				data.houses = await getData('house');
				data.children = await getData('children');

				async function getData(a) {
					const promise = new Promise((resolve, reject) => { getData(a, resolve, reject); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					const results = await promise;
					
					function getData(a, resolve, reject) {
						let query = `SELECT * FROM ${a} WHERE `;
						if(a == 'children') query += `parentA = ${player.id} OR parentB = ${player.id}`;
						else query += `player = ${player.id}`;

						conn.query(query, function(error, results, fields) {
							if(error) throw error;
							resolve(results);
						}).on('error', err => { sqlHandle(err); });
					}

					
					if(!results.length) {
						let warn;
						if(a == 'job' || a == 'degree') { warn = 'nojobdegree';
							console.log(`Player ${player.id} seems not to have a ${a} value.`); }
						return warn;
					}
					
					if(a == 'job' || a == 'degree') return results[0];
					else {
						let others = [], male = [], female = [];
						let carHouse = [];

						results.forEach(res => {
							if(a == 'children') {
								if(res.children === 0) other.push(res);
								if(res.children === 1) male.push(res);
								if(res.children === 2) female.push(res);										
							} else carHouse.push(res);
						});

						if(a == 'children') return { others, male, female };
						return carHouse;
					}
				}


				return { data, player };
			}
		}


		let embeds = [];
		const promiseB = new Promise((resolve, reject) => { createEmbed(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });		
		await promiseB;

		async function createEmbed(resolve, reject) {
			let z = client.data.get('zodiac', user.zodiac);
			z = `${z.zodiac} ${z.symbol}`;

			for(let i = 0; i < profiles.length; i++) {
				const embed = await createEmbed(profiles[i]);
				embeds.push(embed); }
			resolve();
	
			async function createEmbed(pl) {
				const player = pl.player;
	
				let g = client.data.get('gender', player.gender);
				g = `${g.gender} ${g.symbol}`;
				let c = client.data.get('country', player.country);
				c = `${c.country} ${c.flag}`;
	
				let embed = {
					author: {
						name: player.name,
						icon_url: message.author.avatarURL
					},
					description: `A **${player.age}-year-old ${g}**,\nfrom **${c}**.\n`,
					fields: [
						{ name: '**Cash** ' + process.env.EMT_CASH, value: `Bank balance: \`${cashSign(player.cash)}\``},
						{ name: '**`Happy ' + process.env.EMT_HAPPY + '`**', value: `${player.happy}/100`, inline: true },
						{ name: '**`Social ' + process.env.EMT_SOCIAL + '`**', value: `${player.social}/100`, inline: true },
						{ name: '\u200b', value: '\u200b', inline: true },
						{ name: '**`Health ' + process.env.EMT_HEALTH + '`**', value: `${player.health}/100`, inline: true },
						{ name: '**`Looks ' + process.env.EMT_LOOKS + '`**', value: `${player.smarts}/100`, inline: true },
						{ name: '**`Smarts ' + process.env.EMT_SMARTS + '`**', value: `${player.looks}/100`, inline: true },
					],
					footer: { text: `Zodiac: ${z} (set per user)\nTime of birth` },
					timestamp: player.birth,
					thumbnail: {}
				};
	
				if(player.active) embed.color = process.env.CLR_HELP;
				if(player.img && configs['profilePic']) embed.thumbnail.url = player.img;
	
				if(player.sick) {				
					const s = client.data.get('sick', player.sick);
					let str = `${(s.have) ? 'Has' : 'Diagnosed with'} ${s.sick}.`;
					let rate = s.effect.letal && s.effect.letal;
					if(rate) {
						if(player.age > 50) rate += 5;
						if(player.age > 70) rate += 5;
						if(player.age > 90) rate += 5;
						str += `\nThere is a \`${rate}%\` risk of death.`; }
					embed.fields.push({ name: '**Wellness**', value: `${str}` });
				}
	
	
				const data = pl.data;

				let net = player.cash;	
	
				let str = 'Still too young for any of this.';
				if(data.degree) {
					if(data.degree.degree > 0) {
						let d = client.data.get('degree', data.degree.degree);
						if(player.dropped) str = `Decided to drop and never finished ${d.msg}...`;
						else {
							if(data.degree.degree > 4) {
								if(data.degree.years > 5) str = 'Holds a degree in ';
								else str = 'Studying for a degree in ';
							} else {
								if(data.degree.years > 4) str = 'Finished ';
								if(data.degree.years == 0) str = 'Just entered ';
								else str = 'Still attending '; }
							str += `${d.msg}.`; }
		
						if(data.degree.degree > 1) {
							str += '\n';
							if(data.job) {
								if(data.job.job > 0) {
									let j = client.data.get('job', data.job.job);
									str += `Gets \`$${parseFloat(data.job.salary).toFixed(2)}\` every month,\n`
									str += `${(player.retired) ? `after having retired from ` : 'following '} the ${j.job} career`;
									str += (player.retired) ? '.' : `,\nworking as ${j.ranks[data.job.rank][0]} ${j.ranks[data.job.rank][1]}.` }
							} else str += 'Currently unemployed.'; }
					}
					embed.fields.push({ name: '**Work & Education** ' +
						process.env.EMT_WORKEDU, value: str });
					
					if(data.degree.loan && data.degree.paidin) net -= (data.degree.loan * data.degree.paidin);
				}

				str = '';
				kids = [];
				if(data.children) {
					if(data.children.female.length > 0) kids.push([data.children.female, 'girl']);
					if(data.children.male.length > 0) kids.push([data.children.male, 'boy']);
					if(data.children.other.length > 0) kids.push([data.children.other, 'other']); }
				if(kids.length) embed.description += checkParent(kids);
	
				function checkParent(kids) {
					for(let i = 0; i < kids.length; i++) {
						kids[i][0].forEach(k => net -= k.cost); // jshint ignore:line

						let quant = kids[i][0].length;
						let gender = kids[i][1];
	
						if(i == 0) {
							if(player.gender == 1 || player.gender == 3)
							str = `${(i + 1 == kids.length) ? 'He is ' : ''} father of `;
							else if(player.gender == 2 || player.gender == 4)
							str = `${(i + 1 == kids.length) ? 'She is ' : ''} mother of `;						
							else str = 'Parent of ';
						} else if(i + 1 == kids.length) str += '\nand ';
	
						else str += ", ";	
						str += `\`${quant} ${gender}${(quant > 1) ? 's' : ''}\``;
						if(i + 1 == kids.length) str += '!';
					}
					return str;
				}
	
				if(player.preg) embed.description += (str) ? '\nAnd she is pregnant! ' : '\n\nShe is pregnant! ' + process.env.EMT_PREG;	

				let cars = {}, houses = {};
				if(data.cars || data.houses) {
					if(data.cars.length) cars = calcValue(data.cars);
					if(data.houses.length) houses = calcValue(data.houses); }

				function calcValue(a) {
					let value = 0, debt = 0;
					a.forEach(prop => {
						value += prop.value;
						debt += prop.loan; });
					return { value, debt };
				}

				str = '';
				if(data.cars) {
					if(data.cars.length > 0) {
						str += `${data.cars.length} cars, `+
							`worth \`$${parseFloat(cars.value).toFixed(2)}\` total.`;
						net += cars.value;
						net -= cars.debt; } }
				if(str) str += '\n';
				if(data.houses) {
					if(data.houses.length > 0) {
						str += `${data.houses.length} houses, worth `+
							`\`$${parseFloat(houses.value).toFixed(2)}\` total.`;
						net += houses.value;
						net -= houses.debt; } }
				if(str) embed.fields.push({ name: '**Properties** ' +
					process.env.EMT_STATE, value: str });
	
				embed.fields[0].value += `\nNet worth: \`${cashSign(net)}\``;	
	
				if(player.marry) {
					const married = await getMarry();
					embed.fields.push({ name: '**Married to**', value: married }); }
	
				async function getMarry() {
					const promise = new Promise((resolve, reject) => { getMarry(a, resolve, reject); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					const results = await promise;
					return results;
	
					function getMarry(resolve, reject) {
						conn.query(`SELECT name FROM player WHERE id = ${player.marry}`, function(error, results, fields) {
							if(error) throw error;
							resolve(results[0]);
						}).on('error', err => { sqlHandle(err); });
					}
				}
	
	
				return embed;
			}
		}


		let i = 0, preMsg, msg, filters = [];
		do {
			await sendProfile();
			result = await waitReaction();
		} while(result == 'repeat');
		if(result == 'exit') return;

		async function sendProfile() {
			const cmdActive = `\`${p}active\``;

			let content;
			if(profiles[i].player.active) content = `This is your ${cmdActive} character.`;
			else content = `Use \`${process.env.EMT_SET}\` to set your new active character.`;
			if(preMsg) await preMsg.edit(content);
			else message.channel.send(content).then(m => preMsg = m);

			if(msg) { msg.clearReactions(); await msg.edit({ embed: embeds[i] }); }
			else await message.channel.send({ embed: embeds[i] }).then(m => msg = m);

			if(i > 1) await msg.react(process.env.EMT_FIRST).then(filters.push(process.env.EMT_FIRST));
			if(i > 0) await msg.react(process.env.EMT_BACK).then(filters.push(process.env.EMT_BACK));
			if(!profiles[i].player.active) await msg.react(process.env.EMT_SET).then(filters.push(process.env.EMT_SET));
			if((i + 1) < embeds.length) await msg.react(process.env.EMT_NEXT).then(filters.push(process.env.EMT_NEXT));
			if((i + 2) < embeds.length) await msg.react(process.env.EMT_LAST).then(filters.push(process.env.EMT_LAST));
		}

		async function waitReaction() {
			if(!filters.length) return 'exit';
			const filter = (reaction, user) => { return filters.includes(reaction.emoji.name) && user.id === message.author.id; };	
			
			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function waitReaction(resolve, reject) {
				msg.awaitReactions(filter, {max: 1, time: 60000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_FIRST:
							i = 0;
							return resolve('repeat');
						case process.env.EMT_BACK:
							i--;
							return resolve('repeat');
						case process.env.EMT_SET:
							await setActive();
							return resolve('repeat');
						case process.env.EMT_NEXT:
							i++;
							return resolve('repeat');
						case process.env.EMT_LAST:
							i = embeds.length;
							return resolve('repeat');
					}
				})
				.catch(async () => {
					await preMsg.edit('It took too long for any reaction.');
					msg.clearReactions();
					resolve('exit');
				});
			}
		}

		async function setActive() {
			let a = profiles.findIndex(p => p.player.active == true);			

			const promise = new Promise((resolve, reject) => { setActive(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			await message.reply(`${profiles[i].player.name} has been successfully set as your new active character.`);

			function setActive(resolve, reject) {
				conn.query(`UPDATE player SET active = false WHERE id = ${profiles[a].player.id}`,function(error, results, fields) {
					if(error) throw error;
					profiles[a].player.active = false;
					conn.query(`UPDATE player SET active = true WHERE id = ${profiles[i].player.id}`,function(error, results, fields) {
						if(error) throw error;
						profiles[i].player.active = true;
						resolve();
					}).on('error', err => { sqlHandle(err); });
				}).on('error', err => { sqlHandle(err); });
			}
		}


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------');
			console.log(`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function cashSign(a) {
			return a >= 0 ? '$' + parseFloat(a).toFixed(2) : '-$' + parseFloat(a * -1).toFixed(2);
		}
	},

	config: {
		player: true
	},
	
	get help() {
		return {
			name: 'profile',
			aliases: ['character', 'profiles'],
			category: 'Reports',
			description: 'Check your character profile.',
			usage: 'profile (opt.)short'
		};
	}
};