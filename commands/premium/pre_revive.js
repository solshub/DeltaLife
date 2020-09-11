module.exports = {
	run: async ({client, message, p, conn, user, configs = {}}) => {
		let profiles = [];
		const promiseA = new Promise((resolve, reject) => { getPlayers(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });		
		let result = await promiseA;
		if(result == 'notenough') return message.reply('I\'m sorry, none of your characters died yet.');

		function getPlayers(resolve, reject) {
			conn.query(`SELECT * FROM player WHERE alive = false AND user = ${user.id} ORDER BY active DESC`,
			async function(error, results, fields) {
				if(error) throw error;
				if(results.length < 1) resolve('notenough');
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
					description: `Died at the age of **${player.age}**.\n` +
						`A **${g}**,\nfrom **${c}**.\n`,
					fields: [					
						{ name: '**Cash** ' + process.env.EMT_CASH, value: `Bank balance: \`${cashSign(player.cash)}\``},
						{ name: '**`Happy ' + process.env.EMT_HAPPY + '`**', value: `0/100`, inline: true },
						{ name: '**`Social ' + process.env.EMT_SOCIAL + '`**', value: `0/100`, inline: true },
						{ name: '\u200b', value: '\u200b', inline: true },
						{ name: '**`Health ' + process.env.EMT_HEALTH + '`**', value: `${player.health}/100`, inline: true },
						{ name: '**`Looks ' + process.env.EMT_LOOKS + '`**', value: `${player.smarts}/100`, inline: true },
						{ name: '**`Smarts ' + process.env.EMT_SMARTS + '`**', value: `${player.looks}/100`, inline: true },
					],
					footer: { text: 'When you die, your marriage is lost,\n'+
						'Along with your Happy and Social.\nTime of death' },
					timestamp: player.death,
				};
	
				if(player.img && configs['profilePic']) embed.thumbnail.url = player.img;
	
	
				return embed;
			}
		}


		let i = 0, preMsg, msg, filters = [];
		do {
			await sendProfile();
			result = await waitReaction();
		} while(result == 'repeat');

		async function sendProfile() {
			const content = `Use \`${process.env.EMT_SET}\` to select who you want to revive.`;
			if(preMsg) await preMsg.edit(content);
			else message.channel.send(content).then(m => preMsg = m);

			if(msg) { msg.clearReactions(); await msg.edit({ embed: embeds[i] }); }
			else await message.channel.send({ embed: embeds[i] }).then(m => msg = m);

			if(i > 1) await msg.react(process.env.EMT_FIRST).then(filters.push(process.env.EMT_FIRST));
			if(i > 0) await msg.react(process.env.EMT_BACK).then(filters.push(process.env.EMT_BACK));
			await msg.react(process.env.EMT_SET).then(filters.push(process.env.EMT_SET));
			if((i + 1) < embeds.length) await msg.react(process.env.EMT_NEXT).then(filters.push(process.env.EMT_NEXT));
			if((i + 2) < embeds.length) await msg.react(process.env.EMT_LAST).then(filters.push(process.env.EMT_LAST));
		}

		async function waitReaction() {
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
							await setAlive();
							preMsg.delete(100);
							msg.delete(100);
							return resolve();
						case process.env.EMT_NEXT:
							i++;
						break;
						case process.env.EMT_LAST:
							i = embeds.length;
						break;
					}
					return resolve('repeat');
				})
				.catch(async e => { 
					console.log(e);
					await preMsg.edit('It took too long for any reaction.');
					msg.clearReactions();
					resolve();
				});
			}
		}

		async function setAlive() {
			const cmdActive = `\`${p}active\``;

			const promise = new Promise((resolve, reject) => { setAlive(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			await message.reply(`${profiles[i].player.name} was successfully brought back to life! `+
				`If you want to play as him, remember to set your ${cmdActive} character.`);

			function setAlive(resolve, reject) {
				const query = 'UPDATE player SET alive = true, death = NULL, ' +
					`happy = 0, social = 0 WHERE id = ${profiles[i].player.id}`;
				conn.query(query,function(error, results, fields) {
					if(error) throw error;
					profiles[i].player.alive = true;
					resolve();
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
	},
	
	get help() {
		return {
			name: 'revive',
			aliases: [''],
			category: 'Premium',
			description: 'Revive any of your dead characters. Only available if you\'re a patreon supporter.',
			usage: 'revive'
		};
	}
};