const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, p, conn, user, player}) => {		
		if(player.age < 15) return message.channel
		.send(`${firstWord(player.name)}'s WAY too young for any of this.`);

		const options = ['drink, but not too much', 'don\'t drink anything', 'drink as much as you can']

		const quotes = client.data.get('drink');
		let quote = chance.pickone(Object.values(quotes));
		quote = wordsPerLine(quote.msg);		
		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)} wants to grab a drink`,
				icon_url: message.author.avatarURL
			},
			description: quote,
			fields: [
				{ name: 'React with...',
				value: `\`${process.env.EMT_ALLOW}\` and ${options[0]}\n` }
			]
		};

		if(!player.addict.alcohol) embed.fields[0].value += `\`${process.env.EMT_DENY}\` and ${options[1]}\n`;
		else embed.footer = { text: 'You\'re addicted to alcohol, so you cannot deny.' }
		embed.fields[0].value += `\`${process.env.EMT_YEAH}\` and ${options[2]}`;


		let msg, filters = [process.env.EMT_ALLOW, process.env.EMT_YEAH];
		await message.channel.send({embed}).then(m => msg = m);

		await msg.react(process.env.EMT_ALLOW);	
		if(!player.addict.alcohol) await msg
			.react(process.env.EMT_DENY).then(() =>
			filters.push(process.env.EMT_DENY));
		await msg.react(process.env.EMT_YEAH);

		filter = (reaction, author) => { return filters
			.includes(reaction.emoji.name) && author.id === message.author.id; };		

		let choose;
		const promiseA = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promiseA;
		if(result === 'exit') return;

		function waitReaction(resolve, reject) {
			msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
			.then(async collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_DENY:
						choose = 1;					
						return resolve(0);
					case process.env.EMT_ALLOW:
						choose = 0;
						return resolve(1);
					case process.env.EMT_YEAH:
						choose = 2;
						return resolve(3);
				}
			})
			.catch(() => {
				message.reply('I\'m sorry, it took too long for any reaction.').then(replyMsg => {
					msg.delete(100);
					replyMsg.delete(10000);
					message.delete(10000);
					resolve('exit');
				});
			});
		}


		let drinks = result, stats,
		doneEmbed = {
			color: process.env.CLR_ACT_POS,
			author: {
				name: `${firstWord(player.name)} choose to...\n` + wordsPerLine(options[choose]),
				icon_url: message.author.avatarURL },
			description: 'You decided not to drink anything. That\'s probably for the best.'
		};

		if(drinks) {
			stats = await updateStats();
			doneEmbed.footer = { text: stats };
			if(drinks == 1)
				doneEmbed.description = 'You drank just enough to have some fun. ';
			else if(drinks > 0)
				doneEmbed.description = 'You drank way too much and got hammered... ' +
					'You\'re feeling terrible, but you regret nothing.';
		} 

		async function updateStats() {
			const tmpDrinks = (drinks > 1) ? 2 : drinks;

			const happyAlt = calcNear(Math.round(tmpDrinks * 6));
			const happy = calcMaxMin(player.happy + happyAlt);

			const socialAlt = calcNear(Math.round(tmpDrinks * 6));			
			const social = calcMaxMin(player.social + socialAlt);

			const healthAlt = calcNear(Math.round(tmpDrinks * - 5));
			let health;
			if(drinks > 0) health = calcMaxMin(player.health - healthAlt);


			const promise = new Promise((resolve, reject) => { updateStats(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateStats(resolve, reject) {
				let arr = [ happy, social ];
				let query = `UPDATE player SET happy = ?, social = ?`
				if(health) { query += `, health = ?`; arr.push(health); }
				query += ` WHERE id = ${player.id}`;
				conn.query(query, arr, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}


			let str = `+${happyAlt} happy${(health) ? ',' : ' &'} +${socialAlt} social`;
			if(health) str += ` & ${healthAlt} health`;
			return str;
		

			function calcMaxMin(a, b = {}) {
				if(typeof b !== 'object') b = { min: 0, max: 100 };
				if(!b.min) b.min = 0; if(!b.max) b.max = 100;

				if(a > b.max) return b.max;
				if(a < b.min) return b.min;
				return a;
			}	

			function calcNear(a) {				
				const min = a - 2;
				const max = a + 2;
				return chance.integer({ min, max });
			}
		};


		if(drinks) {
			let deathRisk = 2;
			if(player.addict.alcohol) deathRisk += 5.5;
			deathRisk += Math.round(player.yearly.alcohol / 1.5);
			if(chance.bool({likelihood: deathRisk})) {
				return client.commands.get('death')
				.run({client, message, conn, user, player, cause: 'of alcohol poisoning'}); }
			
			await client.commands.get('addict')
			.run({ client, message, conn, user, player, addict: { set: 'alcohol', value: drinks } });

			let diseases = client.data.get('sick');
			drinkDiseases = Object.values(diseases).filter(d => d.risk && d.risk.drinking);
			if(chance.bool({ likelihood: ((drinks * 10) + 10) })) {
				const disease = chance.pickone(drinkDiseases);
				const index = Object.values(diseases).findIndex(d => d.sick == disease.sick);
				const str = await insertSick(index, disease.sick);
				await message.channel.send(str);
			}
		}

		async function insertSick(index, name) {
			await client.commands.get('achievs')
			.run({client, message, conn, user, player, achiev: 'sick'});

			
			const promise = new Promise((resolve, reject) => { insertSick(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function insertSick(resolve, reject) {
				conn.query(`INSERT INTO sick(player, sick) VALUES(${player.id}, ${index})`,
				function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}


			return `${process.env.EMT_WARN} You\'ve been diagnosed with ${name}!`;
		}				

		doneEmbed.description = wordsPerLine(doneEmbed.description);
		await message.channel.send({ embed: doneEmbed })

		await client.commands.get('achievs')
		.run({ client, message, conn, user, achiev: 'alcohol' });
		
		await client.commands.get('timeout')
		.run({client, message, p, conn, user, time: { set: 'drink' }});
		

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
		player: true
	},
	
	get help() {
		return {
			name: 'drink',
			aliases: ['drinking', 'alcohol', 'beer', 'booze', 'liquor', 'drinks'],
			category: 'Action',
			description: 'Serve yourself a drink.',
			usage: 'drink'
		};
	}
};