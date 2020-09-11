const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, args, p, conn, user, player, treat}) => {
		if(typeof treat == 'undefined') return client.commands.get('sick')
		.run({client, message, args, p, conn, user, player});

		
		const diseases = client.data.get('sick');
		const disease = Object.values(diseases).find(d => d == treat.sick);
		

		let embed = {
			author: {
				name: `${firstWord(player.name)} wants to see a doctor`,
				icon_url: message.author.avatarURL }
		}, preMsg, cost;

		if(player.age <= 18) {
			if(player.cash < 100) return message.channel
			.send('You don\'t have enough money for going to the doctor!\n' +
				'Try to get at least $100 if you really want this.')
			cost = Math.round(player.cash * 0.2);

			embed.color = process.env.CLR_WARN;
			embed.name = `${firstWord(player.name)} seeking treatment`;
			embed.description = wordsPerLine('Based on your wealth, ' +
				`going to the doctor will cost you $${parseFloat(cost).toFixed(2)}, ` +
				'are you really sure this is what you want?');

			await message.channel.send({ embed }).then(m => preMsg = m);
			const result = await waitReaction();
			if(result == 'exit') return;
			preMsg.delete(100);
			
		} else message.channel.send('Your parents paid the treatment for you.');

		async function waitReaction() {
			const cmdDoctor = `\`${p}doctor [disease]\``;

			await preMsg.react(process.env.EMT_ALLOW);
			await preMsg.react(process.env.EMT_DENY);

			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function waitReaction(resolve, reject) {
				filter = (reaction, author) => { return [process.env.EMT_ALLOW, process.env.EMT_DENY]
					.includes(reaction.emoji.name) && author.id === message.author.id; };

				preMsg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_ALLOW:
							return resolve();
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
				name: `${firstWord(player.name)}'s doctor said:`,
				icon_url: message.author.avatarURL },
			footer: {}
		}

		if(!disease.risk.medic) {
			embed.description = 'I\'m deeply sorry... ' + 
				'But, there\'s no medical treatment available for';
		} else {
			if(chance.bool({likelihood: disease.risk.medic})){
				await deleteSick();
				embed.color = process.env.CLR_ACT_POS;
				embed.description = 'Congratulations! The treatment worked. ' + 
					'You\'re no longer suffering from';				
			} else embed.description = 'It looks like treatment ' +
				'didn\'t work this time... You continue to suffer from';
		}

		async function deleteSick() {
			const promise = new Promise((resolve, reject) => { deleteSick(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function deleteSick(resolve, reject) {
				conn.query(`DELETE FROM sick WHERE player = ${treat.player} AND sick = ${treat.sick}`,
				function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}


		embed.footer.text = await updateStats(embed.color == process.env.CLR_ACT_POS);

		async function updateStats(add) {
			const val = [calcNear(5), calcNear(5)];

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


		embed.description = wordsPerLine(`"${embed.description} ${disease.sick}."`);
		await message.channel.send({ embed });


		if(embed.color == process.env.CLR_ACT_POS) {
			await client.commands.get('achievs')
			.run({client, message, conn, user, player, achiev: 'treated'}); }
		


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
			name: 'doctor',
			aliases: ['medic', 'treatment', 'treat', 'hospital'],
			category: 'World',
			description: 'Go to the doctor treat your diseases.',
			usage: 'doctor [disease]'
		};
	}
};