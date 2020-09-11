const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, args, conn, user, player}) => {
		if(player.dropped) return message.reply('I\'m sorry, you already dropped out of school.')
		if(player.degree.degree == 4 && player.degree.years >= 5)
		return message.reply('I\'m sorry, you are not currently attending school.')
		

		let preMsg;
		await message.channel.send(`${process.env.EMT_WARN} If you\'re in university, you may join another in the future, ` +
			'otherwise, you won\'t ever be able to finish studies.').then(m => preMsg = m);

		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)} wants to quit school`,
				icon_url: message.author.avatarURL
			},
			description: 'Are you sure you want to drop out of school?\n' + 
				'**This action is permanent.**'
		};

		let msg;
		await message.channel.send({ embed }).then(m => msg = m);

		await msg.react(process.env.EMT_ALLOW);
		await msg.react(process.env.EMT_DENY);

		const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		preMsg.delete(100);
		msg.delete(100);
		if(result == 'exit') return;

		function waitReaction(resolve, reject) {
			filter = (reaction, author) => { return [process.env.EMT_ALLOW, process.env.EMT_DENY]
				.includes(reaction.emoji.name) && author.id === message.author.id; };

			msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
			.then(async collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_ALLOW:
						return resolve();
					case process.env.EMT_DENY:
						return exit('I see, you gave up on dropping out of school.'); }
			}).catch(() => exit('I\'m sorry, it took too long for any reaction.'));

			function exit(str) {
				message.reply(str).then(replyMsg => {
					replyMsg.delete(10000);
					message.delete(10000);
					resolve('exit');
				});
			}
		}


		let doneEmbed = {
			author: { 
				name: `${firstWord(player.name)} `,
				icon_url: message.author.avatarURL
			},
			description: `At the age of ${player.age}, you `
		}

		let degree;
		if(chance.bool({ likelihood: Math.round((player.looks - 30) / 3) })) {
			if(player.degree.degree < 5) {
				degree = client.data.get('degree', player.degree.degree);
				degree = degree.msg }
			else degree = 'university';
			await updateDegree();
		}

		async function updateDegree() { 
			const promise = new Promise((resolve, reject) => { updateDegree(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateDegree(resolve, reject) {
				// degree (1 - 4), years = 5 => finished
				// degree (5+), years = 6 => finished
				let query = 'UPDATE ';
				if(player.degree.degree > 4 && player.degree.years <= 5) 
					query += 'degree SET degree = 4, years = 5 WHERE player';
				else query += 'player SET dropped = true WHERE id';			
				query += ` = ${player.id}`;
				conn.query(query, function(error, results, fields) { 
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}

		if(degree) {
			doneEmbed.color = process.env.CLR_ACT_POS;
			doneEmbed.author.name += 'dropped out!'
			doneEmbed.description += `really did it. You successfully dropped out of ${degree}.`;
		} else {
			doneEmbed.color = process.env.CLR_ACT_NEG;
			doneEmbed.author.name += 'couldn\'t drop out...'
			doneEmbed.description += `tried to quit school, but your parent's didn\'t allow it.`; }		
		doneEmbed.description = wordsPerLine(doneEmbed.description);

		message.channel.send({ embed: doneEmbed });


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------');
			console.log(`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
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
			name: 'drop-out',
			aliases: ['drop', 'dropout', 'abandon', 'quit'],
			category: 'World',
			description: 'Drop out from school, or from university.',
			usage: 'drop-out'
		};
	}
};