const moment = require('moment');

module.exports = {
	run: async ({client, message, p, conn, user, time}) => {
		const cmdTimeout = `\`${p}timeout\``;

		let timeouts = client.data.get('timeout');
		timeouts = Object.values(timeouts);


		if(time) {
			if(time.check && user.timeout[time.set]) {
				const timeOfAction = moment(user.timeout[time.set]).format('YYYY-MM-DD HH:mm:ss');
				const timePassed = moment().diff(timeOfAction);
				
				const timeout = timeouts.find(ti => ti.set == time.set);
				if(timePassed < timeout.time) {
					const timeLeft = moment.duration(timePassed)
						.subtract(moment.duration(timeout.time)).humanize();
	
					await client.commands.get('timeouts')
					.run({client, message, p, conn, user, time: {set: time.set}})
	
					return `you still have to **wait ${timeLeft}** of ${cmdTimeout} before ` +
						`using ${(time == 'general') ? 'another command' : 'this command again'}!`
				}
			}

			await updateTimeout(time.reset);	
			return;
		}

		async function updateTimeout(nullify) {
			const promise = new Promise((resolve, reject)=> { updateTimeout(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateTimeout(resolve, reject) {
				const timeNow = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

				const query = 'UPDATE timeout SET ' +
					`${time.set} = ${(nullify) ? 'NULL' : `'${timeNow}'`} ` +
					`WHERE user = ${user.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;

					conn.query(`SELECT ${time.set} FROM timeout WHERE user = ${user.id}`,
					function(error, results, fields) {
						if(error) throw error;
						user.timeout[time.set] = results[0];
						resolve();
					}).on('error', err => { sqlHandle(err); });
				}).on('error', err => { sqlHandle(err); });
			}
		}


		user.timeouts = {
			general: [
				{ time: user.timeout.age, set: 'age' },
			],
			actions: [
				{ time: user.timeout.random, set: 'random' },
				{ time: user.timeout.drink, set: 'drink' },
				{ time: user.timeout.drugs, set: 'drugs' },
				{ time: user.timeout.study, set: 'study' },
				{ time: user.timeout.work, set: 'work' }
			]
		}
		

		let embed = {
			color: process.env.CLR_HELP,
			author: {
				name: `${firstWord(message.author.username)}'s timeouts`,
				icon_url: message.author.avatarURL
			},
			fields: [],
			timestamp: new Date()
		};


		let strActions = '', strGeneral = '';
		Object.entries(user.timeouts).forEach(t => {
			let str = '';
			t[1].forEach(time => {
				const timeout = timeouts.find(ti => ti.set == time.set);

				let timePassed;
				if(time.time) {
					const timeOfAction = moment(time.time).format('YYYY-MM-DD HH:mm:ss');
					timePassed = moment().diff(timeOfAction); }

				const timeLeft = moment.duration(timePassed)
					.subtract(moment.duration(timeout.time)).humanize(true);


				if(str) str += '\n';
				str += `**\`${p}${time.set}\`** | `;

				if(!time.time || timePassed >= timeout.time)
					str += '*IS READY!*';
				else str += `Ready ${timeLeft}`;
			});
			
			if(t[0] == 'general') strGeneral += str;
			else if(t[0] == 'actions') strActions += str;
		});

		embed.fields.push({ name: 'General', value: strGeneral });
		embed.fields.push({ name: 'Actions', value: strActions });


		message.channel.send({embed});	


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function firstWord(str) {
			const arr = str.split(" ");
			return arr[0]; }	
	},	

	config: {
	},
	
	get help() {
		return {
			name: 'timeout',
			aliases: ['timeouts'],
			category: 'Utils',
			description: 'Check your timeouts.',
			usage: 'timeout'
		};
	}
};