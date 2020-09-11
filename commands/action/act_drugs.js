const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, p, conn, user, player}) => {		
		if(player.age < 17) return message.channel
		.send(`${firstWord(player.name)}'s WAY too young for any of this.`);

		const options = [ 'go on, but carefully', 'get out of there', 'get as high as you can', 'call the police' ];

		const quotes = client.data.get('drug');
		let quote = chance.pickone(Object.values(quotes));
		quote = wordsPerLine(quote.msg);		
		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)}'s trying to do drugs`,
				icon_url: message.author.avatarURL
			},
			description: quote,
			fields: [
				{ name: 'React with...',
				value: `\`${process.env.EMT_ALLOW}\` and ${options[0]}\n` }
			]
		};

		if(!player.addict.drugs) embed.fields[0].value += `\`${process.env.EMT_DENY}\` and ${options[1]}\n`;
		else embed.footer = { text: 'You\'re addicted to drugs, so you cannot deny.' }
		embed.fields[0].value += `\`${process.env.EMT_YEAH}\` and ${options[2]}`;
		if(!player.addict.drugs) embed.fields[0].value += `\n\`${process.env.EMT_FUCK}\` and ${options[3]}\n`;


		let msg, filters = [process.env.EMT_ALLOW, process.env.EMT_YEAH];
		await message.channel.send({embed}).then(m => msg = m);

		await msg.react(process.env.EMT_ALLOW);	
		if(!player.addict.drugs) await msg
			.react(process.env.EMT_DENY).then(() =>
			filters.push(process.env.EMT_DENY));
		await msg.react(process.env.EMT_YEAH);
		if(!player.addict.drugs) await msg
			.react(process.env.EMT_FUCK).then(() =>
			filters.push(process.env.EMT_FUCK));

		filter = (reaction, author) => {return filters
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
					case process.env.EMT_FUCK:
						choose = 3;
						return resolve(-3);
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


		let drugs = result, stats,
		doneEmbed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)} choose to...\n` + wordsPerLine(options[choose]),
				icon_url: message.author.avatarURL }
		};

		if(drugs === 0) { doneEmbed.description =
			'You decided to get out of there. That\'s probably for the best.' }
		else {
			stats = await updateStats();

			doneEmbed.footer = { text: stats };
			if(drugs < 0) doneEmbed.description =
				'At the first opportunity, you called the police! It got everyone mad at you... But it needed to be done.';
			else if(drugs == 1) doneEmbed.description =
				'It got you feeling amazing!';
			else doneEmbed.description =
				'You can\'t remember what happened and your pants went missing... You have no idea where you are, but it was incredible!';
		}

		async function updateStats() {
			let happy, social, health;
			let tmpDrugs = (drugs > 1) ? 2 : ((drugs < -1) ? -2 : drugs);
			const happyAlt = calcNear(Math.round(tmpDrugs * 8.5));
			const socialAlt = calcNear(Math.round(tmpDrugs * 5));
			const healthAlt = calcNear(Math.round(tmpDrugs * -7.5));

			if(drugs > 0) {
				happy = player.happy + happyAlt;
				social = player.social + socialAlt;
				health = player.health - healthAlt;
			} else {
				happy = player.happy - happyAlt;
				social = player.social - socialAlt;
			}

			happy = calcMaxMin(happy);
			social = calcMaxMin(social);
			if(health) health = calcMaxMin(health);


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


			let str = `${(happyAlt >= 0) ? ' +' : ''}${happyAlt} happy` +
				`${(health) ? ',' : ' &'}` + ` ${(socialAlt >= 0) ? ' +' : ''}${socialAlt} social`;
			if(health) str += ` & ${healthAlt} health`;
			return str;


			function calcMaxMin(a, b = {}) {
				if(typeof b !== 'object') b = { min: 0, max: 100 };
				if(!b.min) b.max = 0; if(!b.max) b.max = 100;

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
		
		
		if(drugs) {
			let deathRisk = 3;
			if(player.addict.drugs) deathRisk += 2;
			deathRisk += player.yearly.drugs;
			if(chance.bool({likelihood: deathRisk})) {
				const death = data.commands.get('death')
				return death.run({client, message, conn, user, player, cause: 'of drug overdose'}); }

			await client.commands.get('addict')
			.run({ client, message, conn, user, player, addict: { set: 'drugs', value: drugs } });
		}

		doneEmbed.description = wordsPerLine(doneEmbed.description);
		await message.channel.send({ embed: doneEmbed })
		

		await client.commands.get('achievs')
		.run({ client, message, conn, user, achiev: 'drugs' });
		
		await client.commands.get('timeout')
		.run({client, message, p, conn, user, time: { set: 'drugs' }});
		

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
			name: 'drugs',
			aliases: ['drug', 'do-drugs', 'get-high', 'narcotics', 'weed'],
			category: 'Action',
			description: 'Get yourself high.',
			usage: 'drink'
		};
	},
};