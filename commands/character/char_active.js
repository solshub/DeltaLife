module.exports = {
	run: async ({client, message, p, conn, user, configs = {}}) => {
		let profiles = [];
		const promiseA = new Promise((resolve, reject) => { getPlayers(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });		
		await promiseA;

		function getPlayers(resolve, reject) {
			conn.query(`SELECT * FROM player WHERE alive = true AND user = ${user.id} ORDER BY active DESC`,
			async function(error, results, fields) {
				if(error) throw error;
				for(let i = 0; i < results.length; i++) {
					profiles.push({ player: results[i] }); }
				resolve();
			}).on('error', err => { sqlHandle(err); });
		}


		let embeds = [];
		const promiseB = new Promise((resolve, reject) => { createEmbed(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });		
		await promiseB;

		async function createEmbed(resolve, reject) {
			for(let i = 0; i < profiles.length; i++) {
				const embed = await createEmbed(profiles[i]);
				embeds.push(embed); }
			resolve();
	
			async function createEmbed(p) {
				const player = p.player;
	
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
					footer: { text: 'Time of birth' },
					timestamp: player.birth,
					thumbnail: {}
				};
	
				if(player.active) embed.color = process.env.CLR_HELP;
				if(player.img && configs['profilePic']) embed.thumbnail.url = player.img;

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
						break;
						case process.env.EMT_BACK:
							i--;
						break;
						case process.env.EMT_SET:
							await setActive();
						break;
						case process.env.EMT_NEXT:
							i++;
						break;
						case process.env.EMT_LAST:
							i = embeds.length;
						break;
					}
					return resolve('repeat');
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

			await message.reply(`${profiles[i].player.name} was successfully set as your new active character.`);

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
			name: 'active',
			aliases: [''],
			category: 'Character',
			description: 'Select your active character.',
			usage: 'active'
		};
	}
};