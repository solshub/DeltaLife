module.exports = {
	run: async ({client, message, args, p}) => {
		let msg = args.join(' ');
		if(msg.length < 20) return message.reply('I\'m sorry, please try to write a more detailed ' +
			'description of the problem. Minimum length is 20 characters.');
		else if(msg.length > 1020) return message.reply('I\'m sorry, your message is too long. ' +
			'Please stay under 1020 characters (it\'s discord fault). ');

		let swears = client.data.get('swear');
		swears = Object.values(swears);

		for(let s of swears) {			
			if(args.includes(s)) {console.log(s); return message.reply('I\'m sorry, ' +
				'please don\'t include any inappropriate language ' +
				'in your message. It has been automatically denied.');} }		

		const cmdSupport = `\`${p}support\``;

		await message.channel.send(`Hey, please consider joining our ${cmdSupport} server.`);


		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: 'Bug report!',
				icon_url: message.author.avatarURL },
			description: (msg.length >= 120) ? msg : wordsPerLine(msg),
			footer: { text: 'You might be contacted in the future.' },
			timestamp: new Date()
		};

		await message.delete(100);
		await message.channel.send('Are you sure you want to send this? ' +
			'Please include a guide on how to reproduce the problem. ' +
			'If you don\'t react, **your message will be automatically sent.**').then(m => preMsg = m);
		await message.channel.send({ embed }).then(m => msg = m);		

		const result = await waitReaction();
		if(result == 'exit') return;
		await message.reply('The message was sucessfully sent! Thank you.');
		
		async function waitReaction() {
			await msg.react(process.env.EMT_ALLOW);
			await msg.react(process.env.EMT_DENY);
			
			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;
			
			function waitReaction(resolve, reject) {
				const filter = (reaction, author) => {return [process.env.EMT_ALLOW, process.env.EMT_DENY]
					.includes(reaction.emoji.name) && author.id === message.author.id; };

				msg.awaitReactions(filter, {max: 1, time: 60000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_ALLOW:
							return resolve();
						case process.env.EMT_DENY:
							await message.reply('I see, bug report cancelled.');
							return resolve('exit');
					}
				})
				.catch(async () => {
					await preMsg.edit('You didn\'t react in time. ' +
						'You message was succesfully sent, thanks for your support.');
					await msg.clearReactions();
					resolve();
				});
			}
		}


		const channel = await client.channels.get(process.env.BUG_REPORT);
		if(!channel) return;

		embed.color = process.env.CLR_HELP;
		embed.author = {};
		await channel.send(`New report, from <@!${message.author.id}>.`);
		await channel.send({ embed });


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
		allowSpecial: true
	},
	
	get help() {
		return {
			name: 'report',
			aliases: ['bugreport', 'bug-report', 'bug'],
			category: 'Utils',
			description: 'Report a bug. This will be send directly to my creator.',
			usage: 'report [your-message]'
		};
	}
};