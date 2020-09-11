const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, conn, player}) => {
		if(player.retired) return message.reply('I\'m sorry, you are already retired.');
		if(!player.job.job) return message.reply('I\'m sorry, you\'re currently unemployed.');
		if(player.age < 50) return message.reply('I\'m sorry, you\'re too young for retirement.');


		const salary = player.job.salary * 0.8;
		const job = client.data.get('job', player.job.job);
		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)} wants to retired`,
				icon_url: message.author.avatarURL
			},
			description: wordsPerLine(`Are you sure you want to retired from the ${job.job} career? ` + 
				`Currently, you work as ${job.ranks[player.job.rank].article} ${job.ranks[player.job.rank].msg} ` +
				`If you do this, you'll get $${parseFloat(salary).toFixed(2)} monthly.`)
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
						return exit('I see, you gave up on retiring from your job.'); }
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

		if(chance.bool({ likelihood: player.age + 10 })) {
			doneEmbed.color = process.env.CLR_ACT_POS;
			doneEmbed.author.name += 'finally retired!'
			doneEmbed.description += `decided to retire from the ${job.job} career, `+
				`after ${player.job.years} years of service.`;
			doneEmbed.footer = { text: `You\'ll get ${parseFloat(salary).toFixed(2)} monthly.` }
			await updateJob();
		} else {
			doneEmbed.color = process.env.CLR_ACT_NEG;
			doneEmbed.author.name += 'couldn\'t retire...'
			doneEmbed.description += 'tried to retire, but your boss convinced you ' +
				' otherwise by saying your help is much needed in the company.'; }			

		async function updateJob() { 
			const promise = new Promise((resolve, reject) => { updateJob(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateJob(resolve, reject) {
				conn.query(`UPDATE player SET retired = true WHERE id = ${player.id}`,
				function(error, results, fields) { 
					if(error) throw error;
					player.retired = true;
					conn.query(`UPDATE job SET salary = ${salary} WHERE player = ${player.id}`,
					function(error, results, fields) { 
						if(error) throw error;
						player.retired = true;
						resolve();
					}).on('error', err => { sqlHandle(err); });
				}).on('error', err => { sqlHandle(err); });
			}
		}

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
			name: 'retire',
			aliases: ['retirement', 'stop-working', 'retiring'],
			category: 'World',
			description: 'Retire from your work. Only available if you\'re older than 60.',
			usage: 'retire'
		};
	}
};