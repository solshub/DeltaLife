module.exports = {
	run: async ({client, message, p, conn, user}) => {
		const cmdPatreon = `\`${p}patreon\``
		if(!user.patreon) return message.reply('I\'m sorry. '+
			`You need to be a ${cmdPatreon} supporter in order of using this command.`);
		
		let embeds = [];
		
		const zodiacs = Object.values(client.data.get('zodiac'));
		zodiacs.forEach(z => {
			let relations = [];
			z.partners.forEach(z => {
				const p = client.data.get('zodiac', z);
				relations.push(p.symbol);
			});

			embeds.push({
				color: process.env.CLR_HELP,
				author: {
					name: `${z.zodiac}'s horoscope ${z.symbol}`,
					icon_url: message.author.avatarURL
				},
				description: wordsPerLine(z.desc) +
					'\n`Good relations with ' + relations.join(' ') + '`',
				footer: { text: z.bonus }
			})
		})	

		let result, i = 0, msg, preMsg, filters = [];
		do {
			await sendEmbed();
			result = await waitReaction();
		} while(result == 'repeat');
		if(result == 'exit') return;

		async function sendEmbed() {
			let content = `Use \`${process.env.EMT_SET}\` to set your new zodiac.`;
			if(user.zodiac == i) content = 'This is your current zodiac.';
			if(preMsg) await preMsg.edit(content);
			else message.channel.send(content).then(m => preMsg = m);

			const embed = embeds[i];
			embed.description = `*Zodiac ${i + 1}/12*\n` + embed.description;

			if(msg) { msg.clearReactions(); await msg.edit({ embed }); }
			else await message.channel.send({ embed }).then(m => msg = m);

			if(i > 1) await msg.react(process.env.EMT_FIRST).then(filters.push(process.env.EMT_FIRST));
			if(i > 0) await msg.react(process.env.EMT_BACK).then(filters.push(process.env.EMT_BACK));
			if(user.zodiac !== i) await msg.react(process.env.EMT_SET).then(filters.push(process.env.EMT_SET));
			if((i + 1) < embeds.length) await msg.react(process.env.EMT_NEXT).then(filters.push(process.env.EMT_NEXT));
			if((i + 2) < embeds.length) await msg.react(process.env.EMT_LAST).then(filters.push(process.env.EMT_LAST));
		}

		async function waitReaction() {
			const filter = (reaction, user) => { return filters
				.includes(reaction.emoji.name) && user.id === message.author.id; };	
			
			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function waitReaction(resolve, reject) {
				msg.awaitReactions(filter, {max: 1, time: 60000, errors: ['time']})
				.then(collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_FIRST:
							i = 0;
						break;
						case process.env.EMT_BACK:
							i--;
						break;
						case process.env.EMT_SET:
							preMsg.delete(100);
							msg.delete(100);
							return resolve();
						case process.env.EMT_NEXT:
							i++;
						break;
						case process.env.EMT_LAST:
							i = embeds.length - 1;
						break;
					}
					return resolve('repeat');
				})
				.catch(async () => { 
					await preMsg.edit('It took too long for any reaction.');
					msg.clearReactions();
					resolve('exit');
				});
			}
		}
	

		user.zodiac = i;

		const promise = new Promise((resolve, reject) => { setZodiac(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		await promise;

		function setZodiac(resolve, reject) {
			conn.query(`UPDATE user SET zodiac = ${user.zodiac} WHERE id = ${user.id}`,
			function(error, results, fields) {
				if(error) throw error;
				resolve();
			}).on('error', err => { sqlHandle(err); });
		}

		
		const embed = {			
			color: process.env.CLR_ACT_POS,
			author: {
				name: `${firstWord(message.author.username)}'s new horoscope`,
				icon_url: message.author.avatarURL
			},
			description: 'You new zodiac sign is ' +
				`${zodiacs[user.zodiac].zodiac} ${zodiacs[user.zodiac].symbol}!\n ` +
				'Congrats, and thanks for your support.',
			footer: { text: zodiacs[user.zodiac].bonus }
		}

		await message.channel.send({ embed });

		
		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
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

		function firstWord(str) {
			const arr = str.split(" ");
			return arr[0];
		}
	},

	config: {
	},
	
	get help() {
		return {
			name: 'set-zodiac',
			aliases: ['setzodiac'],
			category: 'Premium',
			description: 'Set your user\'s zodiac. Only available if you\'re a patreon supporter.',
			usage: 'set-zodiac'
		};
	}
};