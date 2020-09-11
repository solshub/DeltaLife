const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, args, cmd, p, conn, user, player}) => {
		if(isNaN(args[0])) return message.reply('I\'m sorry, you need to tell how much you want to bet.');
		if(args[0] < 10) return message.reply('you can\'t bet that little! Try betting at least $10.');

		const cmdRoulette = `\`${p}${cmd.help.usage}\``;

		let value = args.shift();
		console.log(value, player.cash);

		if(player.cash < value) return message.reply(`I\'m sorry, you\'re don\'t have that much money.`);
		else if(player.cash == value)
			await message.channel.send(`${process.env.EMT_WARN} Be careful. That\'s all your money.`);


		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)} went gambling`,
				icon_url: message.author.avatarURL
			},
			description: `You\'re about to bet $${parseFloat(value).toFixed(2)}!\n\n`,
			fields: [],
			footer: { text: '' }
		}, filters = [], preMsg;

		
		let numbers = [];
		if(args.length) {
			let repeated;
			for(let n of args) {
				if(!isNaN(n) && n >= 0) {
					if(n > 36) return message.reply('please only pick numbers lower or equal to 36.');
					else if(numbers.includes(n)) {
						if(repeated) return;
						else await message.reply('repeated numbers will be disconsidered.').then(m => repeated = m); }
					else numbers.push(n); }
			}
		}
		
		const red = [1, 3, 5, 7, 9, 12,
			14, 16, 18, 19, 21, 23,
			25, 27, 30, 32, 34, 36];
		const black = [2, 4, 6, 8, 10, 11,
			13, 15, 17, 20, 22, 24,
			26, 28, 29, 31, 33, 35];
		const odd = [1, 3, 5, 7, 9, 11,
			13, 15, 17, 19, 21, 23,
			25, 27, 29, 31, 33, 35];
		const even = [2, 4, 6, 8, 10, 12,
			14, 16, 18, 20, 22, 24,
			26, 28, 30, 32, 34, 36];

		const multiplier = (numbers.length) ? (7 - numbers.length) : 0.25;

		if(!numbers.length) {
			if(args.includes('red')) numbers = red;
			else if(args.includes('black')) numbers = black;
			else if(args.includes('odd')) numbers = odd;
			else if(args.includes('even')) numbers = even; }


		if(numbers.length) {
			if(args.includes('red') || args.includes('black') || args.includes('odd') || args.includes('even')) {
				let guess;
				if(args.includes('red')) guess = 'a **red**';
				else if(args.includes('black')) guess = 'a **black**';
				else if(args.includes('odd')) guess = 'an **odd**';
				else if(args.includes('even')) guess = 'an **even**';
				embed.description += `You\'re guessing it will land on ${guess} number!\n`;

			} else {
				if(numbers.length == 5) {
					await message.reply(`only the first 4 numbers will be considered.`);
					numbers = numbers.splice(0, 3); }
				else if(numbers.length > 6) {
					await message.reply(`only the first 6 numbers will be considered.`);
					numbers = numbers.splice(0, 5); }

				embed.description += wordsPerLine(`You\'re guessing the ball will land in \`${numbers.join(' or ')}\`!\n`);
			}


			embed.description += 'Good luck with that. If you get it right,\n' +
				`your prize will be **$${parseFloat(value * multiplier).toFixed(2)}**.`;

			filters.push(process.env.EMT_ALLOW);

			if(player.addict.gamble) embed.footer = { text: 'It will auto-start in 20 seconds.' };
			else filters.push(process.env.EMT_DENY);

			preMsg = `React with \`${process.env.EMT_ALLOW}\` to start playing!`;

		} else {
			embed.description += 'Rules:\n' +
				'The ball will land between **0 and 36**.\n' +
				'You have to guess where it will land.\n' +
				'You can pick 1, 2, 3, 4 or 6 numbers.\n' +
				'Fewer the guesses, higher the prize.\n\n' +
				wordsPerLine(`As you didn\'t give any specific numbers (usage: ${cmdRoulette}), ` +
				'react to pick your desired combination of guesses.\n\n'),
			embed.fields.push({
				name: 'The ball will land on...',
				value: `${process.env.EMT_RED} a red number (18 numbers)\n` + 
					`${process.env.EMT_BLACK} a black number (18 numbers)\n` +
					`${process.env.EMT_ONE} an odd number (18 numbers)\n` +
					`${process.env.EMT_TWO} an even number (18 numbers)` });

			filters.push(process.env.EMT_RED);
			filters.push(process.env.EMT_BLACK);
			filters.push(process.env.EMT_ONE);
			filters.push(process.env.EMT_TWO);

			if(player.addict.gamble) embed.footer = { text: 'It will randomly pick in 20 seconds.' };

			preMsg = 'React with your guess on where the ball will land.';
		}

		if(embed.footer.text)
		embed.footer.text = 'You\'re addicted to gambling.\n' + embed.footer.text;

		embed.footer.text += `\nTotal earnings: $${parseFloat(player.gamble.earnRoulette).toFixed(2)}`;
		
		let msg;
		await message.channel.send(preMsg).then(m => preMsg = m);
		await message.channel.send({ embed }).then(m => msg = m);


		if(filters.includes(process.env.EMT_ALLOW)) await msg.react(process.env.EMT_ALLOW);
		if(filters.includes(process.env.EMT_DENY)) await msg.react(process.env.EMT_DENY);

		if(filters.includes(process.env.EMT_RED)) await msg.react(process.env.EMT_RED);
		if(filters.includes(process.env.EMT_BLACK)) await msg.react(process.env.EMT_BLACK);
		if(filters.includes(process.env.EMT_ONE)) await msg.react(process.env.EMT_ONE);
		if(filters.includes(process.env.EMT_TWO)) await msg.react(process.env.EMT_TWO);

		result = await waitReaction();
		if(result == 'exit') return;
		numbers = result;

		async function waitReaction() {
			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			let result = await promise;
			return result;

			async function waitReaction(resolve, reject) {
				filter = (reaction, author) => { return filters
					.includes(reaction.emoji.name) && author.id === message.author.id; };
				
				await msg.awaitReactions(filter, {max: 1, time: 20000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_RED:
							return resolve(red);
						case process.env.EMT_BLACK:
							return resolve(black);
						case process.env.EMT_ONE:
							return resolve(odd);
						case process.env.EMT_TWO:
							return resolve(even);
						case process.env.EMT_ALLOW:
							return resolve(numbers);
						case process.env.EMT_DENY:
							return exit('I see, you gave up on playing the roulette.');
					}
				})
				.catch(async () => {
					if(player.addict.gamble) {
						if(numbers.length) resolve(numbers);
						else resolve(chance.pickone([red, black, odd, even, numbers])); }

					await preMsg.edit('It took too long for any reaction. ' + 
						`If you still want to play, use ${cmdRoulette} again.`);
					await msg.clearReactions();
					resolve('exit');
				});
			}			
		}

		
		do {
			if(msg) msg.delete(100);
			if(preMsg) preMsg.delete(100);
			result = await calcResult();
			if(!result) result = await reroll();
		} while(result == 'repeat');

		async function calcResult() {
			const number = chance.integer({ min: 0, max: 36 });
	
			embed = {
				color: process.env.CLR_ACT_NEG,
				author: {
					name: `${firstWord(player.name)} played roulette`,
					icon_url: message.author.avatarURL
				},
				description: `You have just bet $${parseFloat(value).toFixed(2)} on the roulette!\n` +
					wordsPerLine(`Your guesses were ${numbers.join(' or ')}.\n\n`) +
					`And the sorted number was... **${number}**!!!\n\n`,
				footer: {}
			}
	
			if(numbers.includes(number)) {
				embed.color = process.env.CLR_ACT_POS
				embed.description += wordsPerLine('Congratulations! You won! ' +
					`You\'ll receive back your money + your bet times ${multiplier}!`);
			} else {
				embed.description += 'Oh no... You didn\'t win anything...\n' +
					'You\'ve lost your money this time.\n' +
					'But... you can always keep on trying!';
			}
	
	
			embed.footer.text = await updatePlayer(numbers.includes(number));
	
			async function updatePlayer(add) {
				const val = calcNear(10);

				let prize = (add) ? value * multiplier : value;	
				if(add) { 	
					player.happy += val; player.cash += prize; player.gamble.earnRoulette += prize; }
				else { player.happy -= val; player.cash -= prize; player.gamble.earnRoulette -= prize; }
				player.happy = calcMaxMin(player.happy);
	
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
					let query = `UPDATE player SET happy = ${player.happy}, ` +
						`cash = ${parseFloat(player.cash).toFixed(2)} WHERE id = ${player.id}`;
					conn.query(query,function(error, results, fields) {
						if(error) throw error;
						
						query = 'UPDATE gamble SET earnRoulette = ' +
							`${parseFloat(player.gamble.earnRoulette).toFixed(2)} ` +
							`WHERE player = ${player.id}`;
						conn.query(query, function(error, results, fields) {
							if(error) throw error;
							resolve();
						}).on('error', err => { sqlHandle(err); });
					}).on('error', err => { sqlHandle(err); });
				}
	
	
				return `${firstWord(player.name)} got ${(add) ? '+' : '-'}${val} happy and ${(add) ? '+' : '-'}$${parseFloat(prize).toFixed(2)}`
			}


			await client.commands.get('addict')
			.run({ client, message, conn, user, player, addict: { set: 'gamble' } });
			await client.commands.get('achievs')
			.run({ client, message, conn, user, achiev: 'gamble' });
	
	
			let done = `React with ${process.env.EMT_REROLL} to try again!\n` +
				'You\'ll keep the same guesses and the same bet.'
			if(player.cash < value) 
				done = 'It looks like you\'re out of money and won\'t be able to keep going.'

			await message.channel.send(done).then(m => preMsg = m);
			await message.channel.send({ embed }).then(m => msg = m);

			if(player.cash < value) return 'exit';			
		}

		async function reroll() {
			await msg.react(process.env.EMT_REROLL);

			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			let result = await promise;
			return result;

			async function waitReaction(resolve, reject) {
				filter = (reaction, author) => { return [process.env.EMT_REROLL]
					.includes(reaction.emoji.name) && author.id === message.author.id; };
				
				await msg.awaitReactions(filter, {max: 1, time: 20000, errors: ['time']})
				.then(async collected => {
					resolve('repeat');
				}).catch(async () => {
					await preMsg.edit('It took too long for any reaction. ' + 
						`If you still want to play, use ${cmdRoulette} again.`);
					await msg.clearReactions();
					resolve('exit');
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
		player: true
	},
	
	get help() {
		return {
			name: 'roulette',
			aliases: [''],
			category: 'Gambling',
			description: 'Go gambling! Choose your numbers and play roulette.',
			usage: 'roulette [bet] [numbers]'
		};
	}
};