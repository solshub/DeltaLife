const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, args, p, conn, user, player, treat}) => {
		if(!treat) return client.commands.get('addict')
		.run({client, message, args, p, conn, user, player});

		
		const addictions = client.data.get('addict');
		const addict = Object.values(addictions).find(a => a.set == treat);


		let embed = {
			author: {
				name: `${firstWord(player.name)} wants to go to rehab`,
				icon_url: message.author.avatarURL }
		}, cost, filters = [process.env.EMT_ONE];

		let str = wordsPerLine(`${process.env.EMT_ONE} ` +
			'and go to a group meeting for free');

		if(player.age <= 18) {
			str += wordsPerLine(`\n${process.env.EMT_TWO} and ` +
				`ask your parents to pay rehab for you`);
			filters.push(process.env.EMT_TWO);
		} else {
			if(player.cash < 100) embed.footer = { text: 'You\'re too poor for a rehab clinic.'};
			else {
				cost = Math.round(player.cash * 0.2);
				str += wordsPerLine(`\n${process.env.EMT_TWO} and pay ` +
					`$${parseFloat(cost).toFixed(2)} to go to a rehab clinic`); }
				filters.push(process.env.EMT_TWO);
		}

		str += wordsPerLine(`\n${process.env.EMT_DENY} and don't go to rehab`);
		filters.push(process.env.EMT_DENY);

		embed.fields = [{ name: 'React with...', value: str }];

		let preMsg;
		await message.channel.send({ embed }).then(m => preMsg = m);
		await preMsg.react(process.env.EMT_ONE);
		if(filters.includes(process.env.EMT_TWO))
			await preMsg.react(process.env.EMT_TWO);
		await preMsg.react(process.env.EMT_DENY);

		const result = await waitReaction();
		if(result == 'exit') return;
		preMsg.delete(100);

		async function waitReaction() {
			const cmdDoctor = `\`${p}rehab [addiction]\``;

			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function waitReaction(resolve, reject) {
				filter = (reaction, author) => { return filters
					.includes(reaction.emoji.name) && author.id === message.author.id; };

				preMsg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_ONE:
							return resolve(0);
						case process.env.EMT_TWO:
							return resolve(1);
						case process.env.EMT_DENY:
							await message.reply('I see, you changed your mind about going to the doctor.');
							return resolve('exit');
					};
				}).catch(async () => {
					preMsg.clearReactions();
					await preMsg.edit('It took too long for any reaction.\n' +
						`If you still want treatment, use ${cmdDoctor}.`);
					resolve('exit');
				});
			}
		}


		embed = {			
			color: process.env.CLR_ACT_NEG,
			author: {
				name: `${firstWord(player.name)} went to rehab`,
				icon_url: message.author.avatarURL },
			footer: {}
		};

		if(chance.bool({ likelihood: ((result === 0) ? 20 : 50) })) {
			await updateAddict();
			embed.color = process.env.CLR_ACT_POS;
			embed.description = 'Going to rehab really worked for you! Congratulations, '+
				`you\'re not addicted to ${addict.msg} anymore.`;
		} else {
			embed.description = 'But... it doesn\'t look like it worked. ' +
				`You\'re still addicted to ${addict.msg}. Perhaps you should try again?` }

		async function updateAddict() {
			const promise = new Promise((resolve, reject) => { updateAddict(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateAddict(resolve, reject) {
				conn.query(`UPDATE addict SET ${addict.set} = false WHERE player = ${player.id}`,
				function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}			
		}


		embed.description = wordsPerLine(embed.description);

		embed.footer.text = await updateStats(embed.color == process.env.CLR_ACT_POS);

		async function updateStats(add) {
			const val = [calcNear(((add) ? 10 : 5)), calcNear(((add) ? 10 : 5))];

			if(add) { player.happy += val[0]; player.health += val[1]; }
			else { player.happy -= val[0]; player.health -= val[1]; }
			if(cost) player.cash -= cost;

			const promise = new Promise((resolve, reject) => { updateStats(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateStats(resolve, reject) {
				let query = `UPDATE player SET happy = ${calcMaxMin(player.happy)}` +
					`, health = ${calcMaxMin(player.health)}`;
				if(cost) query += `, cash = ${parseFloat(player.cash).toFixed(2)}`
				query += ` WHERE id = ${player.id}`
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });

				function calcMaxMin(a, b = {}) {
					if(typeof b !== 'object') b = { min: 0, max: 100 };
					if(!b.min) b.min = 0; if(!b.max) b.max = 100;
	
					if(a > b.max) return b.max;
					if(a < b.min) return b.min;
					return a;
				}
			}

			let str = `${(add ? '+' : '-') + val[0]} happy ${(cost) ? ',' : '&'} ${(add ? '+' : '-') + val[1]} health`;
			if(cost) str += ` & -$${parseFloat(cost).toFixed(2)}`;
			return str;
		}


		message.channel.send({ embed });
		


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function calcNear(a) {
			const min = (a > 0 && (a - 2) <= 0) ? 1 : a - 2;
			const max = a + 2;
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
		player: true
	},
	
	get help() {
		return {
			name: 'rehab',
			aliases: ['rehabilitation', 'clinic', 'therapy'],
			category: 'World',
			description: 'Go to the doctor treat your diseases.',
			usage: 'rehab [addiction]'
		};
	}
};