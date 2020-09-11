const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({message, conn, mention, player, menUser, menPlayer}) => {
		if(player.marry) return message.reply('I\'m sorry, you\'re already married!');
		if(player.cash < 11000) return message
			.reply('I\'m sorry. You\'re to poor for a marriage. ' +
				'If you want to do this, try saving at least 11k.');
		
		
		let preMsg;
		message.channel.send(`<@!${menUser.user}>, ` +
			'you\'re being asked in marriage.').then(m => preMsg = m);

		let cost = calcNear(10000, 1000);
		if(player.cash * 0.3 > cost) cost = player.cash * 0.3;

		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)} proposed to ${firstWord(menPlayer.name)}`,
				icon_url: message.author.avatarURL
			},
			description: wordsPerLine(`${menPlayer.name} Do you wish to accept ${player.name} ` +
				`marriage proposal? This will cost ${firstWord(player.name)} ` +
				`$${parseFloat(cost).toFixed(2)}, based on their wealth.`)
		}, msg;

		await message.channel.send({embed}).then(m => msg = m);

		const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		if(result == 'exit') return;

		async function waitReaction(resolve, reject) {
			await msg.react(process.env.EMT_ALLOW);
			await msg.react(process.env.EMT_DENY);

			filter = (reaction, author) => { return [process.env.EMT_ALLOW, process.env.EMT_DENY]
				.includes(reaction.emoji.name) && author.id === mention.id; };	

			msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
			.then(collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_ALLOW:		
						return resolve(true);
					case process.env.EMT_DENY:
						return resolve(false);
				}
			})
			.catch(() => exit('I\'m sorry, it took too long for any reaction.'));

			async function exit(a) {
				await message.reply(a).then(replyMsg => {
					preMsg.delete(100);
					msg.delete(100);
					replyMsg.delete(10000);
					message.delete(10000);
					resolve('exit');
				});
			}
		}


		embed = {
			color: process.env.CLR_ACT_POS,
			author: {
				name: `${firstWord(player.name)} married with ${firstWord(menPlayer.name)}`,
				icon_url: message.author.avatarURL
			},
			footer: {}
		}

		const val = { happy: [calcNear(10), calcNear(10)], social: [calcNear(10), calcNear(10)] };
		embed.footer.text = await updatePlayer(result);

		async function updatePlayer(add) {
			if(add) {
				player.happy = calcMaxMin(player.happy + val.happy[0]);
				player.social = calcMaxMin(player.social + val.social[0]);
				menPlayer.happy = calcMaxMin(menPlayer.happy + val.happy[1]);
				menPlayer.social = calcMaxMin(menPlayer.social + val.social[1]);
				player.cash -= cost;
				player.marry = menPlayer.id;
				menPlayer.marry = player.id;
			} else {
				player.happy = calcMaxMin(player.happy - val.happy[0]);
				player.social = calcMaxMin(player.social - val.social[0]);
				menPlayer.happy = calcMaxMin(menPlayer.happy - val.happy[1]);
				menPlayer.social = calcMaxMin(menPlayer.social - val.social[1]);
			}

			function calcMaxMin(a, b = {}) {
				if(typeof b !== 'object') b = { min: 0, max: 100 };
				if(!b.min) b.min = 0; if(!b.max) b.max = 100;

				if(a > b.max) return b.max;
				if(a < b.min) return b.min;
				return a;
			}

			const promise = new Promise((resolve, reject) => { updatePlayer(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updatePlayer(resolve, reject) {	
				let query = `UPDATE player SET `;
				if(add) { query += `cash = ${parseFloat(player.cash).toFixed(2)}, marry = ${menPlayer.id}, `; }
				query += `happy = ${player.happy}, social = ${player.social} WHERE id = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;

					if(!add) resolve();
					query = `UPDATE player SET marry = ${player.id}, happy = ${menPlayer.happy}, ` +
						`social = ${menPlayer.social} WHERE id = ${menPlayer.id} `;
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
						resolve();
					}).on('error', err => { sqlHandle(err); });
				}).on('error', err => { sqlHandle(err); });
			}

			const sign = (add) ? '+' : '-';
			const and = (add) ? ',' : ' &';
			let str = `${firstWord(player.name)} got ${sign + val.happy[0]} happy${and} ${sign + val.social[0]} social`
			if(add) str += ` & -$${cost} cash`;
			if(add) str += `\n${firstWord(menPlayer.name)} got +${val.happy[1]} happy & +${val.social[1]} social`;
			return str;
		}


		if(!result) {
			embed.color = process.env.CLR_ACT_NEG;
			embed.title = `${firstWord(player.name)} couldn\'t marry to ${firstWord(menPlayer.name)}`
			embed.description = `I\'m sorry, ${firstWord(menPlayer.name)} denied your proposal...`;
		} else embed.description = `${firstWord(menPlayer.name)} accepted ` +
			'your proposal! Congratulations, you two are now married.';
		
		embed.description = wordsPerLine(embed.description);
		message.channel.send({ embed });


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function calcNear(a, b) {
			if(!b) b = 3;
			const min = (a > 0 && (a - b) <= 0) ? 1 : a - b;
			const max = a + b;
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
		onlyGuilds: true,
		mention: true,
		player: true,
		menUser: true,
		menPlayer: true
	},
	
	get help() {
		return {
			name: 'marry',
			aliases: ['marriage', 'vows'],
			category: 'Character',
			description: 'Get married with another player.',
			usage: 'marry @[user]'
		};
	}
};