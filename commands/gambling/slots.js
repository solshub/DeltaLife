const Chance = require('chance');
const chance = new Chance();
const mergeImg = require('merge-img');

module.exports = {
	run: async ({client, message, args, cmd, p, conn, user, player}) => {
		const cmdSlots = `\`${p}${cmd.help.usage}\``;
		if(isNaN(args[0]))
			return message.reply(`please include how much you want to bet. Usage: ${cmdSlots}`);
		if(args[0] < 10)
			return message.reply('you can\'t bet that little! Try betting at least $10.');
		
		const value = parseFloat(args[0]).toFixed(2);

		if(player.money < value)
			return message.reply(`I\'m sorry, you\'re don\'t have that much money.`);
		
		let preMsg;
		if(player.money == value)
			preMsg = `all your money!`;
		else if(value >= (player.cash * 0.75))
			preMsg = `more than 3/4 of your money.`;
		if(preMsg) await message.channel
			.send(`${process.env.EMT_WARN} Be careful! That\'s ` + preMsg)
			.then(m => preMsg = m);

			
		let cases = [
			'💰💰💰, receive **20 times** the original bet',
			'🍋🍋🍋, receive **10 times** the original bet',
			'🍋🍒🍉, receive **3 times** the original bet',
			'🍒🍒🍒, receive **double** the money',
			'🍉🍉🍉 or 🍋🍋, receive the money back',
			'🍒🍒 or 🍉🍉, receive half the bet'
		];

		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)}'s playing slots`,
				icon_url: message.author.avatarURL
			},
			thumbnail: { url: process.env.ICO_SLOTS },
			description: `You\'re about to bet $${value}!\n` +
				`React with ${process.env.EMT_REROLL}, and make it spin!`,
			fields: [{ name: 'Possible outcomes', value: cases.join('\n') }]
		};
		if(player.addict.gamble)
			embed.footer = { text: 'You\'re addicted to gambling!\n' +
				'There\'s no denying. It will spin in 20 seconds.' }

		let msg;
		await message.channel.send({embed}).then(m => msg = m);

		const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		let result = await promise;
		if(result == 'exit') return;

		async function waitReaction(resolve, reject) {
			filters = [process.env.EMT_REROLL];
			await msg.react(process.env.EMT_REROLL);
			if(!player.addict.gamble)
				await msg.react(process.env.EMT_DENY).then(filters.push(process.env.EMT_DENY));

			filter = (reaction, author) => { return filters
				.includes(reaction.emoji.name) && author.id === message.author.id; };
			msg.awaitReactions(filter, {max: 1, time: 20000, errors: ['time']})
			.then(async collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_REROLL:	
						return resolve();
					case process.env.EMT_DENY:			
						return await exit('I see, you gave up on gambling.');
				}
			})
			.catch(async () => {
				if(player.addict.gamble) return resolve();
				await exit('I\'m sorry, it took too long for any reaction.');
			});

			async function exit(a) {
				await message.reply(a).then(replyMsg => {
					if(preMsg) preMsg.delete(100);
					msg.delete(100);
					replyMsg.delete(10000);
					message.delete(10000);
					resolve('exit');
				});
			};
		}


		let total = 0, totalGlobal;
		do {
			totalGlobal = parseFloat(player.gamble.earnSlots);
			if(preMsg) preMsg.delete(100);
			if(msg) msg.clearReactions();
			await message.channel.send(`React with ${process.env.EMT_REROLL} ` +
				`to play again, still betting $${parseFloat(value).toFixed(2)}.`).then(m => preMsg = m);
			await rollSlots();
			result = await reroll();
		} while(result == 'repeat');

		async function rollSlots() {
			embed = {
				color: process.env.CLR_ACT_NEG,
				author: {
					name: `${firstWord(player.name)} went gambling with $${parseFloat(value).toFixed(2)}`,
					icon_url: message.author.avatarURL },
				description: '',
				footer: { text: '' }
			};

			const symbols = Object.values(client.gamble.get('slots'));
			const rolls = [chance.pickone(symbols), chance.pickone(symbols), chance.pickone(symbols)];


			await mergeImgs();
			const files = [{ attachment: './database/gamble/out.png', name: 'out.png' }];
			embed.image = { url: 'attachment://out.png' };

			async function mergeImgs() {
				let imgs = [];
				for(let r of rolls) {
					switch(r) {
						case '💰':
							imgs.push(process.env.ICO_SLOTS_BAG);
							break;
						case '🍋':
							imgs.push(process.env.ICO_SLOTS_LEMON);
							break;
						case '🍒':
							imgs.push(process.env.ICO_SLOTS_CHERRY);
							break;
						case '🍉':
							 imgs.push(process.env.ICO_SLOTS_WATERMELON);
							break;
					}
				};
				await mergeImg(imgs).then(async img => {
					await img.scale(0.7)
						.write('./database/gamble/out.png'); });
			}


			for(let i = 0; i < cases.length; i++) {				
				cases[i] = cases[i].replace(/\*/g, ''); }

			let reward = value, desc;
			if(rolls.every(r => r == '💰')) {
				embed.description += `\`${cases[0]}\``;
				desc = '**Jackpot!!!**';
				reward *= 20;
	
			} else if(rolls.every(r => r == '🍋')) {
				embed.description += `\`${cases[1]}\``;
				desc = '**Congratulations!**';
				reward *= 10;
	
			} else if(compareEachA(rolls)) {
				embed.description += `\`${cases[2]}\``;
				desc = 'Feeling lucky?';
				reward *= 3;
	
			} else if(rolls.every(r => r == '🍒')) {
				embed.description += `\`${cases[3]}\``;
				desc = 'Feeling lucky?';
				reward *= 2;
	
			} else if(rolls.every(r => r == '🍉') || countInArray(rolls, '🍋', 2)) {
				embed.description += `\`${cases[4]}\``;
				desc = 'At least you didn\'t lose anything...';
	
			} else if(countInArray(rolls, '🍒', 2) || countInArray(rolls, '🍉', 2)) {
				embed.description += `\`${cases[5]}\``;
				desc = 'Well... At least you got half of it back.';
				reward *= -0.5;
	
			} else {
				desc = 'Bad luck! You didn\'t get anything! 😢';
				reward *= -1;
	
			}

			function compareEachA(r) {
				let match = [];
				['🍋', '🍒', '🍉'].forEach(c => {
					if(r.includes(c)) {
						r = r.filter(r => r !== c);
						match.push(true); }
				});
				return match.length == 3 && match.every(r => r);
			}

			function countInArray(r, e, l) {
				return r.filter(r => r == e).length == l; }

			
			if(reward > 0) {
				if(reward != value) {
					embed.color = process.env.CLR_ACT_POS;
					desc += ` You just won $${parseFloat(reward).toFixed(2)}!`;
				} else {
					embed.color = process.env.CLR_ACT_WARN;
					desc += ' You got your money back.'; }
			} else desc += ` You just lost $${parseFloat(Math.abs(reward)).toFixed(2)}...`;

			embed.description += '\n' + wordsPerLine(desc);

		
			await client.commands.get('addict')
			.run({ client, message, conn, user, player, addict: { set: 'gamble' } });

			reward = parseFloat(reward);

			if(reward != value)
				embed.footer.text = await updatePlayer();

			async function updatePlayer() {
				player.cash += reward;
				player.gamble.earnSlots += reward;
	
				const promise = new Promise((resolve, reject) => { updatePlayer(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promise;
	
				function updatePlayer(resolve, reject) {
					let query = `UPDATE player SET cash = ${parseFloat(player.cash).toFixed(2)} WHERE id = ${player.id}`;
					conn.query(query, function(error, results, fields) {
						if(error) throw error;

						query = `UPDATE gamble SET earnSlots = ${parseFloat(player.gamble.earnSlots).toFixed(2)} WHERE id = ${player.id}`;
						conn.query(query, function(error, results, fields) {
							if(error) throw error;
							resolve();
						})
					})
				}

				
				return `${firstWord(player.name)} ${(reward > 0) ? 'got ' : 'lost -'}$${parseFloat(Math.abs(reward)).toFixed(2)}`;
			}


			if(reward != value) {
				total += reward;
				totalGlobal += reward; }
			embed.footer.text += `\nTotal earnings: ${(total < 0) ? '-' : ''}$${parseFloat(Math.abs(total)).toFixed(2)}`;
			embed.footer.text += `\nLifetime earnings: ${(totalGlobal < 0) ? '-' : ''}$${parseFloat(Math.abs(totalGlobal)).toFixed(2)}`;

			await message.channel.send({ embed, files }).then(m => msg = m);

			await client.commands.get('achievs')
			.run({ client, message, conn, user, achiev: 'gamble' });
		}

		async function reroll() {
			if(player.cash < value) return preMsg.edit('Oh no... It looks like you\'re too poor to keep on playing.');
			if(value > (player.cash * 0.75))
				preMsg.edit(preMsg.content + `\n${process.env.EMT_WARN} You\'re spending a lot. Perhaps you should stop.`);

			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			let result = await promise;
			return result;

			async function waitReaction(resolve, reject) {
				await msg.react(process.env.EMT_REROLL);

				filter = (reaction, author) => { return [process.env.EMT_REROLL]
					.includes(reaction.emoji.name) && author.id === message.author.id; };
				msg.awaitReactions(filter, {max: 1, time: 20000, errors: ['time']})
				.then(async collected => {
					resolve('repeat');
				})
				.catch(async () => {
					await preMsg.edit('It took too long without any reaction.\n' +
						`If you want to play again, use ${cmdSlots}.`);
					msg.clearReactions();
					resolve();
				});
			}
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
	},	

	config: {
		onlyGuilds: true,
		requireArgs: true,
		player: true
	},
	
	get help() {
		return {
			name: 'slots',
			aliases: ['slot', 'slotmachine', 'slot-machine'],
			category: 'Gambling',
			description: 'Go gambling! Play with slots machine.',
			usage: 'slots [bet]'
		};
	}
};