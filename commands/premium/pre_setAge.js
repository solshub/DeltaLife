module.exports = {
	run: async ({message, args, p, cmd, conn, user, player}) => {
		const cmdPatreon = `\`${p}patreon\``;
		if(!user.patreon) return message.reply('I\'m sorry. '+
			`You need to be a ${cmdPatreon} supporter in order of using this command.`);

		const cmdSetAge = `\`${p}${cmd.help.usage}\``;
		if(isNaN(args[0]) || args[0] < 0) return message.reply('I\'m sorry, ' +
			`you need to set how old you want to make your character. Usage: ${cmdSetAge}`)

		const age = parseInt(args[0]);
		if(age > player.age) return message.reply('I\'m sorry, ' +
			'you can\'t make your character any older than he already is.');
		else if(age == player.age) return message.reply('I\'m sorry, ' +
			`but your character is already ${age} years old.`);
		
		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)}\' time travelling`,
				icon_url: message.author.avatarURL },
			description: `${firstWord(player.name)} is currently ${player.age}-years-old.\n` +
				'**Are you really sure you want to do this?**\n' +
				wordsPerLine('There\'s no going back, as you won\'t be able to set your ' +
				'character\'s age to anything higher than that.'),
			footer: { text: 'This is not actually time travel.' }
		};

		let str = '';

		let loseJob, loseSchool;
		if(age < 17 && player.job.job > 0) { str += 'Lose his job'; loseJob = true };

		if(str) str += '\n';
		if(age <= 4) { str += 'Lose all his school education'; loseSchool = 1 }
		else if(age <= 6) { str += 'Go back to kindergarden'; loseSchool = 2 }
		else if(age <= 10) { str += 'Go back to elementary school'; loseSchool = 3 }
		else if(age <= 14) { str += 'Go back to middle school'; loseSchool = 4 }
		else if(age <= 17) { str += 'Go back to high school'; loseSchool = 5 }
		else if(player.degree.degree > 4) {			
			if(player.degree.years > 5) str += 'Keep his degree';
			else str += 'Still be at university'; }

		if(str) str += '\n';
		str += `Become ${age} years old`;

		embed.fields = [{ name: 'Your character will...', value: str }];


		let msg;
		await message.channel.send({embed}).then(m => msg = m);
		
		const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		await msg.delete(100);
		if(result == 'exit') return;
		
		async function waitReaction(resolve, reject) {
			await msg.react(process.env.EMT_ALLOW);
			await msg.react(process.env.EMT_DENY);

			filter = (reaction, author) => { return [process.env.EMT_ALLOW, process.env.EMT_DENY]
				.includes(reaction.emoji.name) && author.id === message.author.id; };
			await msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
			.then(async collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_ALLOW:
						return resolve();
					case process.env.EMT_DENY:
						return exit('I see, time travel cancelled.');
				}
			}).catch(() => exit('I\'m sorry. You didn\'t choose any option.'));
			
			async function exit(a) {
				await message.reply(a).then(replyMsg => {
					replyMsg.delete(10000);
					message.delete(10000);
					resolve('exit');
				});
			};
		}

		
		let doneEmbed = {
			color: process.env.CLR_ACT_POS,
			author: {
				name: `${firstWord(player.name)}\' time travelled`,
				icon_url: message.author.avatarURL }			
		}

		await updatePlayer();

		async function updatePlayer() {
			const promiseA = new Promise((resolve, reject) => { updatePlayer(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			doneEmbed.description = await promiseA;

			function updatePlayer(resolve, reject) {
				player.age = age;
				conn.query(`UPDATE player SET age = ${player.age} WHERE id = ${player.id}`,
				function(error, results, fields) {
					if(error) throw error;

					conn.query(`DELETE FROM yearly WHERE player = ${player.id}`,
					function(error, results, fields) {
						if(error) throw error;
						resolve(`You\'re ${age}-years-old now.`);
					}).on('error', err => { sqlHandle(err); });
				}).on('error', err => { sqlHandle(err); });
			}


			if(loseJob) {
				const promiseB = new Promise((resolve, reject) => { updateJob(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				doneEmbed.description += await promiseB; }

			function updateJob(resolve, reject) {
				player.job.job = 0;
				player.job.rank = 0;
				player.job.years = 0;
				player.job.salary = 0.00;
				const query = `UPDATE job SET job = ${player.job.job}, rank = ${player.job.rank}, ` +
					`years = ${player.job.years}, salary = ${player.job.salary} WHERE player = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve(`\nYou\'re back to being unemployed.`);
				}).on('error', err => { sqlHandle(err); });
			}


			if(loseSchool) {
				const promiseC = new Promise((resolve, reject) => { updateDegree(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				doneEmbed.description += await promiseC; }
			
			function updateDegree(resolve, reject) {
				player.degree.grade = 'F';
				player.degree.score = 0;
				let query = `UPDATE degree SET grade = '${player.degree.grade}', score = ${player.degree.score}`;
				let str;

				player.degree.loan = 0.00;
				player.degree.paidin = 0;
				query += `, loan = ${player.degree.loan}, paidin = ${player.degree.paidin}`;
				switch(loseSchool) {
					case 1:
						player.degree.degree = 0;
						player.degree.years = 0;
						str = 'You\'re out of school.';
						break;
					case 2:
						player.degree.degree = 0;
						if(age == 5) player.degree.years = 0;
						else if(age == 6) player.degree.years = 1;
						str = 'You\'re back to kindergarden.';
						break;
					case 3:
						player.degree.degree = 0;
						if(age == 7) player.degree.years = 0;
						else if(age == 8) player.degree.years = 1;
						else if(age == 9) player.degree.years = 2;
						else if(age == 10) player.degree.years = 3;
						str = 'You\'re back to elementary school.';
						break;
					case 4:
						11 - 14
						player.degree.degree = 0;
						if(age == 11) player.degree.years = 0;
						else if(age == 12) player.degree.years = 1;
						else if(age == 13) player.degree.years = 2;
						else if(age == 14) player.degree.years = 3;
						str = 'You\'re back to middle school.';
						break;
					case 5:
						player.degree.degree = 0;
						if(age == 15) player.degree.years = 0;
						else if(age == 16) player.degree.years = 1;
						else if(age == 17) player.degree.years = 2;
						str = 'You\'re back to high school.';
						break;
				}

				query += `, degree = ${player.degree.score}, ` +
					`years = ${player.degree.years} WHERE player = ${player.id}`
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve('\n' + str);
				}).on('error', err => { sqlHandle(err); });
			}
		}

		message.channel.send({ embed: doneEmbed });


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
		requireArgs: true,
		player: true
	},
	
	get help() {
		return {
			name: 'set-age',
			aliases: ['time-travel', 'setage'],
			category: 'Premium',
			description: 'Revive any of your dead characters. Only available if you\'re a patreon supporter.',
			usage: 'set-age [age]'
		};
	}
};