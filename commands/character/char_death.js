const moment = require('moment');

module.exports = {
	run: async ({client, message, args, p, conn, user, player, cause}) => {
		let preMsg;
		if(!cause) {
			if(args) args = args.join(' ');

			let preEmbed = {
				color: process.env.CLR_WARN,
				author: { name: 'This action is irreversible' },
				description: wordsPerLine(`Are you REALLY sure you want to end ${firstWord(player.name)}'s life?`) };
			if(args) preEmbed.footer = { text: `${firstWord(player.name)} will die of ${args}` }

			await message.channel.send({ embed: preEmbed }).then(m => preMsg = m);
			
			await preMsg.react(process.env.EMT_ALLOW);
			await preMsg.react(process.env.EMT_DENY);
			filter = (reaction, author) => { return [process.env.EMT_ALLOW, process.env.EMT_DENY]
				.includes(reaction.emoji.name) && author.id === message.author.id; };
			
			const promiseA = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const allow = await promiseA;
			if(!allow) return;

			if(args) cause = args;
			else cause = 'by suicide';
		}

		function waitReaction(resolve, reject) {
			preMsg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
			.then(async collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_ALLOW:
						return resolve(true);
					case process.env.EMT_DENY:
						return exit('I see, character deletion cancelled.');
				}
			})
			.catch(() => { exit('I\'m sorry, it took too long for any reaction.'); });

			async function exit(error) {
				await message.reply(error).then(replyMsg => {
					preMsg.delete(100);
					replyMsg.delete(10000);
					message.delete(10000);
					resolve(false);
				});
			}
		}


		const cmdCreate = `\`${p}${process.env.CMD_CREATE}\``;

		const gender = player.gender;
		const g = client.data.get('gender', gender);

		const country = player.country;
		const c = client.data.get('country', country);

		embed = {
			color: process.env.CLR_ACT_NEG,
			author: {
				name: `${firstWord(player.name)} died ${cause}`,
				icon_url: message.author.avatarURL },
			description: wordsPerLine(`${firstWord(player.name)}, ` +
				`a ${g.gender} from ${c.country}, ` +
				`died at the age of ${player.age}, ${cause}.`),
			thumbnail: { url: process.env.ICO_DEATH }
		}


		await killPlayer();

		async function killPlayer() {
			const promiseA = new Promise((resolve, reject) => { killPlayer(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseA;
	
			function killPlayer(resolve, reject) {				
				const deathTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
				conn.query(`UPDATE player SET alive = false, death = '${deathTime}', ` +
					`active = false WHERE id = ${player.id}`,
				function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}

			let str = '';
			const promiseB = new Promise((resolve, reject) => { updateActive(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promiseB;
			if(result == 'nootherplayer') str = `You don\'t seem to have any other character.\nPerhaps it\'s time to ${cmdCreate} a new one.`;			
			else str = `${result} has been set as your new active character.`;
			if(str) embed.footer = { text: str };

			function updateActive(resolve, reject) {
				conn.query(`SELECT id, name FROM player WHERE alive = true AND user = ${user.id} ORDER BY active DESC`,
				function(error, results, fields) {
					if(error) throw error;
					if(!results.length) return resolve('nootherplayer');

					conn.query(`UPDATE player SET active = true WHERE id = ${results[0].id}`,
					function(error, res, fields) {
						if(error) throw error;
						resolve(firstWord(results[0].name));
					}).on('error', err => { sqlHandle(err); });
				}).on('error', err => { sqlHandle(err); });
			}

			const promiseC = new Promise((resolve, reject) => { updateUser(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseC;

			function updateUser(resolve, reject) {
				user.rerolls++;
				conn.query(`UPDATE user SET rerolls = ${user.rerolls} WHERE id = ${user.id}`,
				function(error, res, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}

		
		await message.channel.send({ embed });


		client.commands.get('achievs').run({ client, message, conn, user, achiev: 'death' });


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
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
			name: 'death',
			aliases: ['suicide', 'die', 'dead'],
			category: 'Character',
			description: 'Delete your currently active character.',
			usage: 'death [death-cause]'
		};
	}
};