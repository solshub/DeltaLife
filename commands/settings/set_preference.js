module.exports = {
	run: async ({client, message, conn, user}) => {
		const pref = client.data.get('sexual', user.sexual);
		let preferences = client.data.get('sexual');
		preferences = Object.values(preferences);
		let reactWith;

		await message.channel.send(
			`React with \`${process.env.EMT_ONE}\` or \`${process.env.EMT_TWO}\` to set your preference.\n`+
			'This will make romantic interactions with you be automatically denied when certain conditions are met, ' +
			'depending on your orientation.')
		.then(m => reactWith = m);

		let embed = {
			color: process.env.CLR_HELP,
			author: { name: 'Sexual orientation' },
			description: 'This won\'t affect the romantic actions you use.\n' +
				'Your options, followed by who WON\'T be auto denied.',
			fields: [],
			footer: { text: 'Current orientation: ' + pref.sexuality }
		};

		const promise = new Promise((resolve, reject) => { embedReaction(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const option = await promise;

		const result = await updatePreference(option);
		message.reply(result);

		async function embedReaction(resolve, reject) {
			let i = 0, limit = 2, msg, filter, filters = [], opts = [], name;

			let result;
			do {
				await pushFields();
				result = await waitReaction();
			} while([result].includes('repeat'));
			resolve(result);

			async function pushFields() {
				if(msg) {
					await msg.clearReactions();
					i = (limit - 2);
					embed.fields = [];
					opts = [];
				}
	
				let p;
				while(i < limit && i < preferences.length) {
					p = preferences[i];	
					name = p.sexuality;
	
					if(opts.length == 1) { opts[1] = p.sexuality; name += ` ${process.env.EMT_TWO}`; }
					if(opts.length == 0) { opts[0] = p.sexuality; name += ` ${process.env.EMT_ONE}`; }
	
					embed.fields.push({ name: name, value: p.desc, inline: true });
					i++;
				}
				
				if(!msg) await message.channel.send({embed}).then(m => msg = m);
				else await msg.edit({embed});
	
	
				if(limit > 2) await msg.react(process.env.EMT_BACK).then(filters.push(process.env.EMT_BACK));
				if(opts[0]) await msg.react(process.env.EMT_ONE).then(filters.push(process.env.EMT_ONE));
				if(opts[1]) await msg.react(process.env.EMT_TWO).then(filters.push(process.env.EMT_TWO));
				if(limit < preferences.length) await msg.react(process.env.EMT_NEXT).then(filters.push(process.env.EMT_NEXT));

				filter = (reaction, author) => { return filters.includes(reaction.emoji.name) && author.id === message.author.id; };
			}
			
			async function waitReaction() {
				const promise = new Promise((res, rej) => { waitReaction(res, rej); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				const res = await promise;
				return res;

				async function waitReaction(resolve, reject) { // jshint ignore:line
					msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
					.then(async collected => {
						const reaction = collected.first();
						switch(reaction.emoji.name) {
							case process.env.EMT_NEXT:
								limit += 2;
								return resolve('repeat');
							case process.env.EMT_BACK:
								limit -= 2;
								return resolve('repeat');
							case process.env.EMT_ONE:
								return resolve(opts[0]);
							case process.env.EMT_TWO:
								return resolve(opts[1]);
						}
					})
					.catch(() => {										
						message.reply('I\'m sorry, it took too long for any reaction.').then(replyMsg => {
							reactWith.delete(100);
							msg.delete(100);
							replyMsg.delete(10000);
							message.delete(10000);
						});
					});
				}
			}
		}


		async function updatePreference(preference) {
			const lowerPreference = preference.charAt(0).toLowerCase() + pref.sexuality.slice(1);

			if(pref.sexuality == preference) return `I'm sorry, you're already ${lowerPreference}.`;

			const promise = new Promise((resolve, reject) => { updatePreference(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function updatePreference(resolve, reject) {
				const id = preferences.findIndex(p => p.sexuality == preference);
				conn.query(`UPDATE user SET sexual = ${id} WHERE id = ${user.id}`, function(error, results, fields) {
					resolve(`contragulations! You're ${lowerPreference} now!`);
				}).on('error', err => { sqlHandle(err); });
			}
		}


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}
	},

	config: {
	},

	get help() {
		return {
			name: 'preference',
			aliases: ['orientation', 'sexual', 'auto-deny', 'autodeny', 'deny'],
			category: 'Settings',
			description: 'Allow auto deny of certain romantic actions.',
			usage: 'preference'
		};
	}
};