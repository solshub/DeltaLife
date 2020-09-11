const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, p, conn, user, player}) => {
		let preMsg, msg;

		let filters, choose;
		let options = [
			player.yearly.job1,
			player.yearly.job2,
			player.yearly.job3,
			player.yearly.job4,
			player.yearly.job5
		];
		if(!player.job.job || player.retired) {
			let str;
			if(player.retired) str = 'You are retired. Getting a job, you\'ll lose your benefits.';
			else if(!player.job.job) str = 'It doesn\'t look like you got a job yet.';

			const minor = player.age < 17;
			// degree (1 - 4), years = 5 => finished
			// degree (5+), years = 6 => finished
			const studying = (player.degree.degree < 5 && player.degree.years < 5);
			const holds = (player.degree.degree > 4 && player.degree.years > 5);
			if(minor) str += '\nYou\'re too young for any of this.'
			else if(studying) str += '\nYou don\'t have time for this! ' +
				'Try finishing school first.';
			else {
				if(player.degree.years <= 5) {
					str += '\nPick any of these options! They change every year.';	
					if(player.degree.paidin) str += 'Be careful, you\'ll still have to pay your student loan.';
				}
				str += '\nPick any of these options! They change every year.';
			}
			if(holds) str += '\nThe top options are based on your degree.'

			await message.channel.send(str).then(m => preMsg = m);
			if(minor || studying) return;


			if(options.includes(0)) {
				options = [];
				let jobs = client.data.get('job');

				let degreeJobs = Object.values(jobs).filter(j => {
					if(!j.degree) return;
					for(let i = 1; i < j.degree.length; i++)
					{ if(j.degree[i] == player.degree.degree) return true; }
				}) || [];
				if(degreeJobs.length) options = options.concat(degreeJobs);
				
				const left = 5 - options.length ;
				if(left > 0) {
					jobs = Object.values(jobs).filter(j =>
						j.degree && !options.some(o => o.job == j.job) && j.degree[0]);
					const arr = chance.pickset(jobs, left);
					options = options.concat(arr);
				}

				await updateYearly();

			} else {				
				let opts = [];
				Object.values(options).forEach(o => opts
					.push(client.data.get('job', o)) );
				options = opts;
			}


			let embed = {
				color: process.env.CLR_WARN,
				author: {
					name: `${firstWord(player.name)}'s job opportunities`,
					icon_url: message.author.avatarURL
				},
				fields: []
			};
			if(holds) {
				const degree = client.data.get('degree', player.degree.degree);
				embed.footer = { text: `You hold a degree in ${degree.msg}` }; }

			filters = [process.env.EMT_ONE, process.env.EMT_TWO, process.env.EMT_THREE,
				process.env.EMT_FOUR, process.env.EMT_FIVE];

			let i = 0;
			options.forEach(o => {
				let str = `Be ${o.ranks[0].article} ${o.ranks[0].msg}`;
				str += `\nAround $${o.ranks[0].pay} per month`
				embed.fields.push({ name: `${o.job} career ${filters[i]}`, value: str });
				i++;
			});


			await message.channel.send({ embed }).then(m => msg = m);

			for(let f of filters) { await msg.react(f) };
			const result = await waitDecision();
			if(result == 'exit') return;

			choose = options[result];
			const salary = calcNear(choose.ranks[0].pay, 'big');
			await setJob(salary);
			
			preMsg.delete(100);
			msg.delete(100);
			
			const doneEmbed = {
				color: process.env.CLR_ACT_POS,
				author: {
					name: `${firstWord(player.name)} got a job!`,
					icon_url: message.author.avatarURL
				},
				description: `You're now following the ${choose.job} career!\n`+
					`You're ${choose.ranks[0].article} ${choose.ranks[0].msg}, for $${salary} a month.`
			};
			return await message.channel.send({ embed: doneEmbed });
		}

		async function updateYearly() {
			const promise = new Promise((resolve, reject) => { updateYearly(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateYearly(resolve, reject) {
				const jobs = client.data.get('job');
				let opportunities = [];
				options.forEach(o => {
					const index = Object.values(jobs).findIndex(opt => opt.job == o.job);
					opportunities.push(index); });

				const query = `UPDATE yearly SET job1 = ?, job2 = ?, ` +
					`job3 = ?, job4 = ?, job5 = ? WHERE player = ${player.id}`;
				conn.query(query, opportunities, function(error, results, fields) {
					if(error) throw error;
					player.yearly.job1 = opportunities[0];
					player.yearly.job2 = opportunities[1];
					player.yearly.job3 = opportunities[2];
					player.yearly.job4 = opportunities[3];
					player.yearly.job5 = opportunities[4];
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}

		async function waitDecision() {
			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
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
		}

		async function setJob(salary = choose.ranks[0].pay) {
			let jobs = client.data.get('job');
			const index = Object.values(jobs).findIndex(o => o.job == choose.job);

			const promiseA = new Promise((resolve, reject) => { updateJob(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseA;

			if(player.degree.degree > 4) {
				const promiseB = new Promise((resolve, reject) => { updateDegree(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promiseB;
			}

			async function updateJob(resolve, reject) {
				const query = `UPDATE job SET job = ${index}, rank = 0, years = 0, score = 0,` +
					`salary = ${salary} WHERE player = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}

			async function updateDegree(resolve, reject) {
				const query = `UPDATE degree SET degree = 4, years = 5 WHERE player = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}


		let diff = 'easy';
		if(player.job.rank >= 4) diff = 'hard';
		else if(player.job.rank >= 2) diff = 'medium';


		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)}'s trying to work`,
				icon_url: message.author.avatarURL },			
			description: 'Its time to do your job!\nReact to *this* message with: '
		};

		let repeats;
		if(diff == 'easy') repeats = 1;
		if(diff == 'medium') repeats = 2;
		if(diff == 'hard') repeats = 3;

		let emotes = Object.values(client.data.get('emote'));
		let reacts = chance.pickset(emotes, repeats);

		let lineBreak = '';
		if(repeats > 1) lineBreak = '\n'
		embed.description += `${lineBreak}${reacts.join(', then ')}.`;


		let pay = player.job.salary;
		pay = calcNear(Math.round(pay / 5), 'big');

		embed.footer = { text: `You'll get paid: $${parseFloat(pay).toFixed(2)}` };


		await message.channel.send('Hover over the embed message, ' +
			'click the little face on the top right, ' +
			'then find the requested emojis.').then(m => preMsg = m);
		await message.channel.send({ embed }).then(m => msg = m);

		let i = 0, result;
		do {
			react = reacts[i];
			result = await waitReaction();
			i++;
		} while(result == 'repeat');
		if(result == 'exit') return;

		async function waitReaction() {
			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const res = await promise;
			return res;

			function waitReaction(resolve, reject) {
				filter = (reaction, author) => { return reacts
					.includes(reaction.emoji.name) && author.id === message.author.id; };
				msg.awaitReactions(filter, {max: 1, time: 15000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case react:
							if((i == 0 && (diff == 'medium' || diff == 'hard'))
							|| (i == 1 && (diff == 'hard')))
								return resolve('repeat');
							return resolve();
						default:
							return resolve('wrong');
					}
				})
				.catch(() => {
					message.reply('your time\'s up! You couldn\'t do it.').then(replyMsg => {
						preMsg.delete(100);
						msg.delete(100);
						replyMsg.delete(10000);
						message.delete(10000);
						resolve('exit');
					});
				});
			}
		}


		msg.clearReactions();
		const correct = (result !== 'wrong');
		let strStats = await updatePlayer(correct);

		if(!correct) await message.channel.send('Wrong order!' + strStats);
		else await message.channel.send('You did it!' + strStats);

		async function updatePlayer(add) {
			let val = 5;
			if(diff == 'medium') val = 10;
			if(diff == 'hard') val = 15;

			const values = [(calcNear(val) * ((add) ? 1 : -1))]
			if(add) values.push(pay * ((add) ? 1 : -1));
			const update = [(calcMaxMin((player.happy + values[0])))]
			if(add) update.push(player.cash + values[1]);

			const promise = new Promise((resolve, reject) => { updatePlayer(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			async function updatePlayer(resolve, reject) {
				query = 'UPDATE player SET happy = ?'
				if(add) query += ', cash = ?';
				query += ` WHERE id = ${player.id}`;
				conn.query(query, update, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}

			let sign = (add) ? '+' : '';
			let str = `\`${sign + values[0]} happy`
			if(add) str += ` & ${sign}$${parseFloat(Math.abs(values[1])).toFixed(2)} cash\``;
			return str
		}


		let strJob;
		if(!player.retired) if(player.job.job !== 0)
		strJob = await updateJob(correct);
		if(strJob) await message.channel.send(strJob);

		async function updateJob(add) {
			const value = calcHigher(5);

			let score;
			if(add) score = player.job.score + value;
			else score = player.job.score - value;
			score = calcMaxMin(score);

			let rank = 0;
			if(score >= 80) rank = 4;
			else if(score >= 60) rank = 3;
			else if(score >= 40) rank = 2;
			else if(score >= 20) rank = 1;

			const promise = new Promise((resolve, reject) => { updateJob(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function updateJob(resolve, reject) {
				conn.query(`UPDATE job SET score = ${score} WHERE player = ${player.id}`,
				function(error, results, fields) {
					if(error) throw error;

					if(rank == player.job.rank) return resolve();
					conn.query(`UPDATE job SET rank = ${rank} WHERE player = ${player.id}`,
					function(error, results, fields) {
						if(error) throw error;
						player.job.rank = rank;

						const job = client.data.get('job', player.job.job);
						const salary = player.job.salary + job.ranks[player.job.rank].pay;
						conn.query(`UPDATE job SET salary = ${salary} WHERE player = ${player.id}`,
						function(error, results, fields) {
							if(error) throw error;
							player.job.salary = salary;

							let str;
							if(add) str = 'You got a promotion for your excellent work performance!';
							else str = 'You got demoted for your low work performance...';
							str += `${firstWord(player.name)}'s now working as `+
							`${job.ranks[player.job.rank].article} ${job.ranks[player.job.rank].msg}.\n`+
							`Your new monthly salary is $${player.job.salary}.`
							resolve();
						}).on('error', err => { sqlHandle(err); });

					}).on('error', err => { sqlHandle(err); });
				}).on('error', err => { sqlHandle(err); });
			}
		}

	
		await client.commands.get('addict')
		.run({ client, message, conn, user, player, addict: { set: 'work' } });

		await client.commands.get('achievs').run({ client, message, conn, user, achiev: 'work' });
		
		await client.commands.get('timeout')
		.run({client, message, p, conn, user, time: { set: 'work' }});


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------');
			console.log(`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function firstWord(str) {
			const arr = str.split(" ");
			return arr[0];
		}

		function calcNear(a, b) {
			let alter = 2;
			if(b == 'big')
			if(String.valueOf(a).length > 2) {				
				const len = String.valueOf(a).length - 2;
				alter *= Math.pow(10, len); }

			const min = (a > 0 && (a - alter) < 0) ? 1 : a - alter;
			const max = a + alter;
			return chance.integer({ min, max });
		}

		function calcHigher(a) {
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
			name: 'work',
			aliases: ['employ', 'job', 'career'],
			category: 'World',
			description: 'Use this to get a job. If you\'re already employed it will give you a random work task. Affects your work performance and may give you money.',
			usage: 'work'
		};
	}
};