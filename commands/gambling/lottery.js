const Chance = require('chance');
const chance = new Chance();
const moment = require('moment');

module.exports = {
	run: async ({client, message, cmd, p, conn, user, player}) => {
		if(100 >= player.cash)
			return message.reply('I\'m sorry, you\'re too poor for that. Try saving at least $100.');

		const cmdWinners = `\`${p}winners\``;
		
		const lottery = await getLottery();

		async function getLottery() {
			const promiseA = new Promise((resolve, reject) => { getLottery(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			let result = await promiseA;
	
			if(!result) {
				const promiseB = new Promise((resolve, reject) => { insertLottery(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				result = await promiseB;
	
				const promiseC = new Promise((resolve, reject) => { getLottery(resolve, reject, result); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				result = await promiseC;
			}

			return result;
	
			function getLottery(resolve, reject, id) {
				let query = 'SELECT lottery, since FROM lottery WHERE ';
				if(!id) query += 'winner IS NULL';
				else query += `id = ${id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					if(!results.length) return resolve();
					resolve(results[0]);
				}).on('error', err => { sqlHandle(err); });
			}
	
			function insertLottery(resolve, reject) {
				conn.query('INSERT INTO lottery() VALUES ()', function(error, results, fieldss) {
					if(error) throw error;
					return resolve(results.insertId);
				}).on('error', err => { sqlHandle(err); });
			}
		}

	
		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)}'s playing the lottery`,
				icon_url: message.author.avatarURL
			},
			description: 'Welcome to the lottery!\n' +
				wordsPerLine('Want to try your luck?! ' +
				'Then select how many tickets you want to buy, ' +
				'but please remember that each one costs you $10!' +
				'If you win, you receive all your money back.\n\n') +
				'The current prize is of...\n ' +
				`💰💰💰 **$${numberWithSpaces(lottery.lottery)}.00** 💰💰💰\n` +
				wordsPerLine(`If you just want to check on past winners, please use ${cmdWinners}.`),
			footer: {
				text: `You have a total of ${(player.cash < 0) ? '-' : ''}$${parseFloat(Math.abs(player.cash)).toFixed(2)}\n` +
					`Your total earnings: ${(player.gamble.earnLottery < 0) ? '-' : ''}$${parseFloat(Math.abs(player.gamble.earnLottery)).toFixed(2)}\n` +
					`Prize running since:`
			},
			timestamp: lottery.since
		};		


		let preMsg, msg, result;
		do {
			result = await waitReaction();
			if(result !== 'exit') {
				if(preMsg) { preMsg.delete(100); preMsg = undefined; }
				if(msg) { msg.delete(100); msg = undefined; }
				result = await calcResult();
			}
		} while(result !== 'exit');

		async function waitReaction() {
			if(100 >= player.cash) {
				await message.channel.send('It looks like you\'re too poor to keep on playing. ' +
					'If you want to keep going, try saving at least $100.').then(m => preMsg = m);
				await message.channel.send({ embed }).then(m => msg = m);
				return 'exit';
			}
			
			
			const reaction = [
				process.env.EMT_ONE,
				process.env.EMT_TWO,
				process.env.EMT_THREE,
				process.env.EMT_FOUR ];

			let str = '', cost, reactWith = [];
			for(let i = 0; (i < reaction.length) && ((10 * Math.pow(10, i + 1)) < player.cash); i++) {
				if(str) str += '\n';
				cost = 10 * Math.pow(10, i + 1);
				reactWith.push(reaction[i]);
				str += `${reactWith[i]} ${Math.pow(10, i + 1)} tickets for $${cost}`; }

			if(!str) {
				await message.channel.send('It looks like you\'re too poor to keep on playing. ' +
					'If you want to keep going, try saving at least $100.').then(m => preMsg = m);
				await message.channel.send({ embed }).then(m => msg = m);
				return 'exit'; }
			embed.fields = [{ name: 'React and buy...', value: str }];


			if(!msg) await client.commands.get('addict')
			.run({ client, message, conn, user, player, addict: { set: 'gamble' } });
			if(!msg) await client.commands.get('achievs')
			.run({ client, message, conn, user, achiev: 'gamble' });

			await message.channel.send('React with how many tickets you want to buy.').then(m => preMsg = m);
			if(!msg) await message.channel.send({ embed }).then(m => msg = m);			
	
	
			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			let result = await promise;
			return result;
	
			async function waitReaction(resolve, reject) {
				const cmdLottery = `\`${p}${cmd.help.name}\``;
	
				let filters = [];
				if(reactWith.length >= 1) await msg.react(reactWith[0]).then(filters.push(reactWith[0]));
				if(reactWith.length >= 2) await msg.react(reactWith[1]).then(filters.push(reactWith[1]));
				if(reactWith.length >= 3) await msg.react(reactWith[2]).then(filters.push(reactWith[2]));
				if(reactWith.length >= 4) await msg.react(reactWith[3]).then(filters.push(reactWith[3]));
	
				filter = (reaction, author) => { return filters
					.includes(reaction.emoji.name) && author.id === message.author.id; };
				
				await msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_ONE:
							return resolve(1);
						case process.env.EMT_TWO:
							return resolve(2);
						case process.env.EMT_THREE:
							return resolve(3);
						case process.env.EMT_FOUR:
							return resolve(4);
					}
				})
				.catch(async () => {
					await preMsg.edit('It took too long for any reaction. ' + 
						`If you still want to play, use ${cmdLottery} again.`);
					await msg.clearReactions();
					resolve('exit');
				});
			}
		}
		
		async function calcResult() {
			const value = 10 * Math.pow(10, result);			

			embed = {
				color: process.env.CLR_ACT_NEG,
				author: {
					name: `${firstWord(player.name)} spent $${parseFloat(value).toFixed(2)} on the lottery`,
					icon_url: message.author.avatarURL
				},
				description: `You bough ${Math.pow(10, result)} tickets!\n`,
				footer: {}
			}


			let win;
			for(let i = 0; i < Math.pow(10, result) && !win; i++) {
				win = chance.bool({ likelihood: 0.01 }); }


			await updateLottery();
		
			async function updateLottery() {
				lottery.lottery += value;

				const promise = new Promise((resolve, reject) => { updateLottery(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promise;
	
				function updateLottery(resolve, reject) {
					let query = `UPDATE lottery SET lottery = ${parseFloat(lottery.lottery).toFixed(2)}`
					if(win) {
						lottery.won = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
						query += `, winner = ${player.id}, won = '${lottery.won}'` }
					query += ' WHERE winner IS NULL'
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
						resolve();
					}).on('error', err => { sqlHandle(err); });
				}
			}


			embed.footer.text = await updatePlayer() + '\n';
	
			async function updatePlayer() {
				player.cash -= value;
				player.gamble.earnLottery -= value;
				if(win) {
					player.cash += lottery.lottery;
					player.gamble.earnLottery += lottery.lottery; }
				
				const val = (win) ? 100 : calcNear(-10);
				player.happy = calcMaxMin(player.happy + val);
	
				function calcNear(a) {
					const min = (a > 0 && (a - 3) <= 0) ? 1 : a - 3;
					const max = a + 3;
					return chance.integer({ min, max });
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
					const query = `UPDATE player SET cash = ${parseFloat(player.cash).toFixed(2)}, ` +
						`happy = ${player.happy} WHERE id = ${player.id}`;
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
		
						conn.query(`UPDATE gamble SET earnLottery = ${parseFloat(player.gamble.earnLottery).toFixed(2)} WHERE player = ${player.id}`,
						function(error, results, fields) {
							if(error) throw error;
							resolve();
						}).on('error', err => { sqlHandle(err); });
					}).on('error', err => { sqlHandle(err); });
				}


				return `${firstWord(player.name)} got ${(win) ? '+' : ''}${val} happy`;
			}


			if(win) {
				embed.color = process.env.CLR_ACT_POS;
				embed.description += '**!!! CONGRATULATIONS !!!**\n' +
					'🏆🏆🏆 **YOU WON THE LOTTERY** 🏆🏆🏆\n\n' +
					'AS PRIZE, YOU RECEIVED A TOTAL OF...\n' +
					`💰💰💰 **$${numberWithSpaces(lottery.lottery)}.00** 💰💰💰\n`;
				embed.footer.text += `Your total earnings: ${player.gamble.earnLottery}\n` + 'Prize won at:';
				embed.timestamp = lottery.won;

				await message.channel.send({ embed }).then(m => msg = m);
				return 'exit';
			}

			embed.description += 'Oh no.. You didn\'t win anything...\n' +
				'But you can always keep on trying!\n\n' +
				'The current prize is of...\n' + 
				`**$${numberWithSpaces(lottery.lottery)}.00**!`;
			embed.footer.text += `You have ${(player.cash < 0) ? '-' : ''}$${parseFloat(Math.abs(player.cash)).toFixed(2)}\n` +
					`Your total earnings: ${(player.gamble.earnLottery < 0) ? '-' : ''}$${parseFloat(Math.abs(player.gamble.earnLottery)).toFixed(2)}\n` +
					'Prize running since:';
			embed.timestamp = lottery.since;
		}

		
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

		function numberWithSpaces(a) {
			a = parseInt(a);
			return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }	
	},	

	config: {
		onlyGuilds: true,
		player: true
	},
	
	get help() {
		return {
			name: 'lottery',
			aliases: ['tickets'],
			category: 'Gambling',
			description: 'Go gambling! Try to win the lottery.',
			usage: 'lottery'
		};
	}
};