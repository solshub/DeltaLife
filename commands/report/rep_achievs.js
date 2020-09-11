module.exports = {
	run: async ({client, message, p, conn, user, achiev}) => {
		const achievs = client.data.get('achiev');

		if(achiev) {
			const promise = new Promise((resolve, reject) => { updateUser(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const value = await promise;
	
			function updateUser(resolve, reject) {
				user[achiev] += 1;
				conn.query(`UPDATE user SET ${achiev} = ${user[achiev]} WHERE id = ${user.id}`,
				function(error, results, fields) {
					if(error) throw error;
					resolve(user[achiev]);
				}).on('error', err => { sqlHandle(err); });
			}

			const achievement = Object.values(achievs).find(a => a.set == achiev);
			const times = achievement.times.slice().reverse().find(t => value == t);
			const index = achievement.times.indexOf(times);
			if(index === -1) return;
			else if(index === 0) achiev +=  'A';
			else if(index === 1) achiev +=  'B';
			else if(index === 2) achiev +=  'C';
			else if(index === 3) achiev +=  'D';

			await updateAchievs(achiev);
			let str = achievement.desc[0] + ` ${times} ` + achievement.desc[1];
			if(times == 1) if(str.endsWith('s!'))
			str = str.substring(0, str.length - 2) + '!';
			return await message.reply(`\n**Congratulations on your new achievement!** ${process.env.EMT_ACHIEV}\n` + str);			
		}

		async function updateAchievs(a) {
			if(user.achievs[a] == true) return;

			const promise = new Promise((resolve, reject) => { updateAchievs(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateAchievs(resolve, reject) {
				conn.query(`UPDATE achievs SET ${a} = true WHERE user = ${user.id}`,
				function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}

			user.achievs[a] = true;
		}


		let achievements = {};
		Object.entries(user.achievs).forEach(a => {
			if(a[0] == 'user') return;
			if(a[1]) {
				const letter = a[0].substring(a[0].length - 1, a[0].length);
				let index;
				if(letter == 'A') index = 0;
				if(letter == 'B') index = 1;
				if(letter == 'C') index = 2;
				if(letter == 'D') index = 3;

				const achiev = a[0].substring(0, a[0].length - 1);
				if(!achievements[achiev]) achievements[achiev] = [];
				achievements[achiev].push(index);
			}
		});

		let descs = [];

		Object.entries(achievements).forEach(a => {	
			let str = (descs.length) ? '\n' : '';
			const achiev = Object.values(achievs).find(ac => ac.set == a[0]);

			a[1].forEach(times => {
				if(str && str !== '\n') str += '\n';
				str += `${achiev.symbol} `;
				str += achiev.small[0] + ` ${achiev.times[times]} ` + achiev.small[1];
				if(achiev.times[times] == 1) if(str.endsWith('s'))
					str = str.substring(0, str.length - 1);
			});

			descs.push(str);
		});

		if(descs.length == 0)
			return message.reply('I\'m sorry! ' +
			'You haven\'t got any achievement yet. ' +
			'Try playing a little more for a while.')

		let embed = {
			color: process.env.CLR_HELP,
			author: { 
				name: `${firstWord(message.author.username)}'s achievements`,
				icon_url: message.author.avatarURL
			}
		}

		let preMsg;
		const cmdAchievs = `${p}achievs`;		
		message.channel.send('These are the achievements you\'ve collected so far.').then(m => preMsg = m);

		let msg, filters = [];

		let i = 0, result;
		do {
			await sendPages();
			result = await waitReaction();
		} while(result !== 'exit');

		async function sendPages() {
			embed.description = '';
			do { embed.description += descs[i]; i++;
			} while(i < descs.length && (i === 0 || (i % 3) !== 0));
	
			if(!msg) await message.channel.send({ embed }).then(m => msg = m);
			else await msg.edit({ embed });

			if(i > 6) await msg.react(process.env.EMT_FIRST).then(filters.push(process.env.EMT_FIRST));
			if(i > 3) await msg.react(process.env.EMT_BACK).then(filters.push(process.env.EMT_BACK));
			if((i + 1) < descs.length) await msg.react(process.env.EMT_NEXT).then(filters.push(process.env.EMT_NEXT));
			if((i + 4) < descs.length) await msg.react(process.env.EMT_LAST).then(filters.push(process.env.EMT_LAST));
		}

		async function waitReaction() {
			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			await msg.clearReactions();
			if(result == 'exit') return 'exit';
			if(typeof result !== 'undefined') i = result;
	
			function waitReaction(resolve, reject) {
				filter = (reaction, author) => { return filters
					.includes(reaction.emoji.name) && author.id === message.author.id; };	
	
				msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_FIRST:		
							return resolve(0);
						case process.env.EMT_BACK:
							return resolve(i - 6);
						case process.env.EMT_NEXT:
							return resolve();
						case process.env.EMT_LAST:
							return resolve(descs.length - 4);
					}
				})
				.catch(async () => {
					await preMsg.edit('*It took too long for any reaction.*\n' +
					`Please, use ${cmdAchievs} again if you\'re still interested.`);
					msg.clearReactions();
					resolve('exit');
				});
			}
		}

		
		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function firstWord(str) {
			const arr = str.split(" ");
			return arr[0];
		}
	},	

	config: {
	},
	
	get help() {
		return {
			name: 'achievs',
			aliases: ['achievements', 'prizes'],
			category: 'Reports',
			description: 'Check your achievements.',
			usage: 'achievs'
		};
	}
};