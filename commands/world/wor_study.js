const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, p, conn, user, player}) => {
		if(player.dropped) return message.reply('you dropped out of school. There\'s no going back now.');

		let preMsg, msg, confirmMsg, choose;
		
		if(!player.degree.degree) {
			return await message.channel.send('You\'re not even in school yet.\n' +
				'You\'re too young for any of this.'); }

		let filters, res;
		let options = [
			player.yearly.degree1,
			player.yearly.degree2,
			player.yearly.degree3,
			player.yearly.degree4,
			player.yearly.degree5
		];
		if(player.degree.degree == 4 && player.degree.years > 4) {
			let str;
			if(!player.job.job) str = 'You just finished high-school\n' +
				'Is it time to attend university?\n';
			else str = 'You already got a job, **you\'ll have to quit**!\n' +
				'Do you really want to attend university?'
			await message.channel.send(str +
				'Pick any of these options! They change every year.').then(m => preMsg = m);

			let degrees = client.data.get('degree');
			if(options.includes(0)) {
				degrees = Object.values(degrees).filter(d => Object.values(degrees).indexOf(d) > 4);

				options = chance.pickset(degrees, 5);
				await updateYearly();

			} else {
				let opts = [];
				Object.values(options).forEach(o => opts
					.push(client.data.get('degree', o)) );
				options = opts;
			}

			let embed = {
				color: process.env.CLR_WARN,
				author: {
					name: `${firstWord(player.name)}'s studies opportunities`,
					icon_url: message.author.avatarURL
				},
				fields: [],
				footer: { text: `You\'re ${player.age}-years-old` }
			};

			filters = [process.env.EMT_ONE, process.env.EMT_TWO, process.env.EMT_THREE,
				process.env.EMT_FOUR, process.env.EMT_FIVE];

			options.forEach(o => {
				let degrees = client.data.get('degree');
				let index = Object.values(degrees).findIndex(d => d.msg == o.msg);

				let jobs = client.data.get('job');
				const opportunities = Object.values(jobs).filter(j => j.degree && j.degree.includes(index));

				let str = 'In the future, you\'ll be able follow'
				let i = 0;
				opportunities.forEach(o => {
					const comma = (i > 0) ? '\nOr ' : '\n';
					str += `${comma}the ${o.job} career!`;
					i++ });				

				embed.fields.push({ name: `${o.msg}'s degree ${filters[options.indexOf(o)]}`, value: str });
			});


			await message.channel.send({ embed }).then(m => msg = m);

			for(let f of filters) { await msg.react(f) };

			const result = await waitDecision();
			if(result == 'exit') return;

			if(result == 'scholar' || result == 'parents') await updateYearly(result);			

			str = '', success;

			if(result == 'scholar') {
				let prob = (player.smarts > 50) ? player.smarts + 10 : 10;
				if(prob > 100) prob = 100;

				if(chance.bool({ likelihood: prob })) {
					str = 'You successfully got a full tuiton scholarship!';
					success = true;
				} else str = 'You couldn\'t get a scholarship...';
			}
			if(result == 'parents') {
				let prob = (player.looks > 50) ? player.looks + 10 : 10;
				if(prob > 100) prob = 100;

				if(chance.bool({ likelihood: prob })) {
					str = 'Your parents agreed to pay it for you!';
					success = true;
				} else str = 'Your parents weren\'t interested in paying it...';
			}

			let footer, monthly = player.degree.loan, months = player.degree.paidin;
			if(result == 'loan') {
				success = true;
				let loan = calcNear(28); loan *= 1000;
				months += calcHigher(90, 30);
				monthly += Math.round(loan / months);
				str = `You accepted a $${loan / 1000}k student loan!\n` +
					`You'll pay $${parseFloat(monthly).toFixed(2)} monthly for ${months} months.`;
				footer = `${months} months are something around ${Math.round(months / 12)} years.`
			}			

			if(success) await setDegree(monthly, months);
			
			let strSuccess = `In 5 years, you'll get your degree in ${choose.msg}!`;
			let strFail = 'Try again next year, or find a way to pay for it.'
			const doneEmbed = {
				author: {
					name: `${firstWord(player.name)} joined university!`,
					icon_url: message.author.avatarURL
				},
				description: str + `\n${((success) ? strSuccess : strFail)}`
			};
			doneEmbed.color = (success) ? process.env.CLR_ACT_POS : process.env.CLR_ACT_NEG;
			if(footer) doneEmbed.footer = { text: footer };

			return await message.channel.send({ embed: doneEmbed });
		}

		async function updateYearly() {
			const promise = new Promise((resolve, reject) => { updateYearly(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateYearly(resolve, reject) {
				const degrees = client.data.get('degree');
				let opportunities = [];
				options.forEach(o => {
					const index = Object.values(degrees).findIndex(opt => opt.msg == o.msg);
					opportunities.push(index); });

				const query = `UPDATE yearly SET degree1 = ?, degree2 = ?, ` +
					`degree3 = ?, degree4 = ?, degree5 = ? WHERE player = ${player.id}`;
				conn.query(query, opportunities, function(error, results, fields) {
					if(error) throw error;
					player.yearly.degree1 = opportunities[0];
					player.yearly.degree2 = opportunities[1];
					player.yearly.degree3 = opportunities[2];
					player.yearly.degree4 = opportunities[3];
					player.yearly.degree5 = opportunities[4];
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}

		async function waitDecision() {
			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			let result = await promise;

			if(result !== 'exit') {		
				msg.delete(100);
				preMsg.delete(100);

				choose = options[result];

				let confirmEmbed = {
					color: process.env.CLR_WARN,
					author: {
						name: `${firstWord(player.name)}'s making a decision...`,
						icon_url: message.author.avatarURL
					},
					description: `You want that ${choose.msg} degree.\n` +
						`How are you going to you pay for it?`
				}

				const abcd = [process.env.EMT_A, process.env.EMT_B, process.env.EMT_C, process.env.EMT_D];
				filters = [abcd[0]];
				res = ['loan'];

				let str = `${abcd[0]} and get a student loan`, i = 1;

				if(!player.yearly.scholarship) {
					str += `\n${abcd[i]} and apply for a scholarship`;
					filters.push(abcd[i]); res.push('scholar'); i++; }
				if(!player.yearly.asking) {
					str += `\n${abcd[i]} and ask your parents for money`;
					filters.push(abcd[i]); res.push('parents'); i++; }

				str += `\n${abcd[i]} and forget about it`;
				filters.push(abcd[i]); res.push('exit'); 

				confirmEmbed.fields = [{ name: 'React with...', value: str }];

				await message.channel.send({ embed: confirmEmbed }).then(m => confirmMsg = m);
				if(filters[0]) await confirmMsg.react(filters[0]);
				if(filters[1]) await confirmMsg.react(filters[1]);
				if(filters[2]) await confirmMsg.react(filters[2]);
				if(filters[3]) await confirmMsg.react(filters[3]);

				const promise = new Promise((resolve, reject) => { waitConfirm(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				result = await promise;

				if(result == 'exit') await exit('you changed your mind about university.');
				else { await confirmMsg.delete(100); } 
			}

			return result;

			function waitReaction(resolve, reject) {
				filter = (reaction, author) => { return filters
					.includes(reaction.emoji.name) && author.id === message.author.id; };
				msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_ONE:
							return resolve(0);
						case process.env.EMT_TWO:
							return resolve(1);
						case process.env.EMT_THREE:
							return resolve(2);
						case process.env.EMT_FOUR:
							return resolve(3);
						case process.env.EMT_FIVE:
							return resolve(4);
					}
				})
				.catch(() => {
					message.reply('I\'m sorry. You didn\'t choose any option.').then(replyMsg => {
						preMsg.delete(100);
						msg.delete(100);
						replyMsg.delete(10000);
						message.delete(10000);
						resolve('exit');
					});
				});
			}

			function waitConfirm(resolve, reject) {
				filter = (reaction, author) => { return filters
					.includes(reaction.emoji.name) && author.id === message.author.id; };
				confirmMsg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_A:
							return resolve(res[0]);
						case process.env.EMT_B:
							return resolve(res[1]);
						case process.env.EMT_C:
							return resolve(res[2]);
						case process.env.EMT_D:
							return resolve(res[3]);
					}
				})
				.catch(async () => {
					await exit('I\'m sorry. You didn\'t make any decision.');
					resolve('exit');
				});
			}

			async function exit(str) {
				await message.reply(str).then(replyMsg => {
					confirmMsg.delete(100);
					replyMsg.delete(10000);
					message.delete(10000);
				});
			}
		}

		async function updateYearly(tried) {
			const promise = new Promise((resolve, reject) => { updateYearly(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateYearly(resolve, reject) {
				let query = 'UPDATE yearly SET ';
				if(tried == 'scholar') query += 'scholarship = true ';
				else if(tried == 'parents') query += 'asking = true ';
				query += `WHERE player = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					player.yearly.scholarship = true;
					player.yearly.asking = true;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}

		async function setDegree(loan, paidin) {
			let degrees = client.data.get('degree');
			const index = Object.values(degrees).findIndex(o => o.msg == choose.msg);

			const promiseA = new Promise((resolve, reject) => { updateDegree(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseA;
		
			if(player.job.job) {
				const promiseB = new Promise((resolve, reject) => { updateJob(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promiseB;
			}

			async function updateDegree(resolve, reject) {
				let query = `UPDATE degree SET degree = ${index}, grade = 'F', score = 0, years = 0`;
				if(loan && paidin) query += `, loan = ${parseFloat(loan).toFixed(2)}, paidin = ${paidin}`;
				query += ` WHERE player = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}

			async function updateJob(resolve, reject) {
				let query = `UPDATE job SET job = 0, rank = 0, score = 0, years = 0, `+
					`salary = 0.00 WHERE player = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}


		let questions = client.data.get('question');
		questions = Object.values(questions);
		

		const easy = questions.filter(q => q.difficulty == 1);
		const medium = questions.filter(q => q.difficulty == 2);
		const hard = questions.filter(q => q.difficulty == 3);

		let hardChance = 20 + ((100 - player.smarts) / 3);
		let medChance = 40 + ((100 - player.smarts) / 2);

		medChance *= ((player.age * 0.01) + 1);
		hardChance *= ((player.age * 0.0125) + 1);

		let question;
		if(chance.bool({likelihood: Math.ceil(hardChance)}))
			question = chance.pickone(hard);
		else {
			if(chance.bool({likelihood: Math.ceil(medChance)}))
				question = chance.pickone(medium);
			else question = chance.pickone(easy);
		}

		let difficulty;
		if(question.difficulty == 1) difficulty = 'easy';
		if(question.difficulty == 2) difficulty = 'medium';
		if(question.difficulty == 3) difficulty = 'hard';


		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)}'s trying to study`,
				icon_url: message.author.avatarURL },			
			description: wordsPerLine(question.msg, 'small'),
			footer: { text: `Difficulty: ${difficulty}` }
		};

		let choices = chance.shuffle(question.choices), desc = '', i = 0;
		choices.forEach(c => {
			let letter;
			if(i == 0) letter = 'A';
			if(i == 1) letter = 'B';
			if(i == 2) letter = 'C';
			if(i == 3) letter = 'D';
			desc += ((desc) ? '\n' : '') + wordsPerLine(`${letter}. `+ c.msg, 'small');
			i++;
		});
		embed.fields = [{ name: 'Your answer is...', value: desc }];


		await message.channel.send('You have **15 seconds** to answer!').then(m => preMsg = m);

		await message.channel.send({ embed }).then(m => msg = m);
		await msg.react(process.env.EMT_A);
		await msg.react(process.env.EMT_B);
		await msg.react(process.env.EMT_C);
		await msg.react(process.env.EMT_D);		

		const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		if(result === 'exit') return;
		choose = choices[result];

		function waitReaction(resolve, reject) {
			filter = (reaction, author) => { return [process.env.EMT_A, process.env.EMT_B, process.env.EMT_C, process.env.EMT_D]
				.includes(reaction.emoji.name) && author.id === message.author.id; };
			
			msg.awaitReactions(filter, {max: 1, time: 15000, errors: ['time']})
			.then(async collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_A:
						return resolve(0);
					case process.env.EMT_B:
						return resolve(1);
					case process.env.EMT_C:
						return resolve(2);
					case process.env.EMT_D:
						return resolve(3);
				}
			})
			.catch(() => {
				message.reply('it took too long for any reaction.').then(replyMsg => {
					preMsg.delete(100);
					msg.delete(100);
					replyMsg.delete(10000);
					message.delete(10000);
					resolve('exit');
				});
			});
		}
				

		let strStats = await updatePlayer(choose.correct);

		async function updatePlayer(add) {
			let val = 10;
			if(add) {
				if(difficulty == 'easy') val = 5;
				if(difficulty == 'hard') val = 15;
			} else {			
				if(difficulty == 'easy') val = 15;
				if(difficulty == 'hard') val = 5;
			}

			const values = [
				(calcNear(val) * ((add) ? 1 : -1)),
				(calcNear(val) * ((add) ? 1 : -1)) ];
			const update = [
				calcMaxMin((player.happy + values[0])),
				calcMaxMin((player.smarts + values[1])) ];

			const promise = new Promise((resolve, reject) => { updatePlayer(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			async function updatePlayer(resolve, reject) {
				conn.query(`UPDATE player SET happy = ?, smarts = ? WHERE id = ${player.id}`,
				update, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
			
			sign = (add) ? ' +' : '';
			return `\`${sign + values[0]} happy & ${sign + values[1]} smarts\``;
		}

		
		let strDegree;

		if(!player.dropped) if(player.degree.degree)
		if((player.degree < 5 && player.degree.years < 5) || (player.degree > 4 && player.degree.years > 5))
		strDegree = await updateDegree(choose.correct);

		async function updateDegree(add) {
			const value = calcHigher(5);
			let score;
			if(add) score = player.degree.score + value;
			else score = player.degree.score - value;
			score = calcMaxMin(score);

			let grade = 'F';
			if(score >= 96) grade = 'A+ ';
			else if(score >= 88) grade = 'A';
			else if(score >= 80) grade = 'A-';

			else if(score >= 72) grade = 'B+ ';
			else if(score >= 64) grade = 'B';
			else if(score >= 56) grade = 'B-';
			
			else if(score >= 48) grade = 'C+ ';
			else if(score >= 40) grade = 'C';
			else if(score >= 32) grade = 'C-';

			else if(score >= 24) grade = 'D+ ';
			else if(score >= 16) grade = 'D';

			const promise = new Promise((resolve, reject) => { updateDegree(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			async function updateDegree(resolve, reject) {
				query = `UPDATE degree SET score = ${score}`
				if(player.degree.grade !== grade) query += `, grade = '${grade}'`;
				query += ` WHERE player = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}

			
			player.degree.score = score;
			if(player.degree.grade !== grade) {
				player.degree.grade = grade;
				return `Your new grade in school is ${grade}${(add) ? '!' : '...'}`;
			}

			return;
		}


		if(choose.correct) await message.channel.send('That\'s it! That\'s the correct answer!');
		else await message.channel.send('I\'m sorry, you choose the wrong answer...');

		str = ((strDegree) ? '\n' : '') + strStats;
		if(strDegree) str += strDegree;
		await message.channel.send(str);


		await client.commands.get('addict')
		.run({ client, message, conn, user, player, addict: { set: 'work' } });
		
		await client.commands.get('achievs').run({ client, message, conn, user, achiev: 'study' });
		
		await client.commands.get('timeout')
		.run({client, message, p, conn, user, time: { set: 'study' }});


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

		function calcNear(a, b) {
			let alter = (b) ? b : 2;

			const min = (a > 0 && (a - alter) < 0) ? 1 : a - alter;
			const max = a + alter;
			return chance.integer({ min, max });
		}

		function calcHigher(a, b) {
			const max = a + 3;
			return chance.integer({ min: a, max });
		}
		
		function calcMaxMin(a, b = {}) {
			if(typeof b !== 'object') b = { min: 0, max: 100 };
			if(!b.min) b.min = 0; if(!b.max) b.max = 100;

			if(a > b.max) return b.max;
			if(a < b.min) return b.min;
			return a;
		}
	},	

	config: {
		onlyGuilds: true,
		player: true
	},
	
	get help() {
		return {
			name: 'study',
			aliases: ['exam', 'question', 'school', 'university', 'learn'],
			category: 'World',
			description: 'Use this to get into university. If you\'re already in school this will give you a random question. Affects your Smarts and your grades.',
			usage: 'study'
		};
	}
};