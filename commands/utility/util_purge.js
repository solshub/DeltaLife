module.exports = {
	run: async ({message, args, p, cmd}) => {
		const cmdPurge = `\`${p}${cmd.help.usage}\``;		
		if(isNaN(args[0]) || args[0] < 1)
			message.reply(`I\'m sorry. You need to include how many messages you want to delete. Usage: ${cmdPurge}.`)			
		if(args[0] > 100)
			return message.reply(`I'm sorry, you are trying to delete way too many message. Try 100 at a time, would you?`).then(msg => { msg.delete(10000); message.delete(10000); });
		
			
		const embed = {
			color: process.env.CLR_WARN,
			author: { name: `Deletion of ${args[0]} messages` },
			description: wordsPerLine('Are you really sure you want to delete ' +
				`${args[0]} messages from this channel? **This action is irreversible.**`)
		}

		let msg;
		await message.channel.send({ embed }).then(m => msg = m);
		const result = await waitReaction();
		if(result == 'exit') return;

		async function waitReaction() {
			await msg.react(process.env.EMT_ALLOW);
			await msg.react(process.env.EMT_DENY);

			promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function waitReaction(resolve, reject) {
				const filter = (reaction, author) => {return [process.env.EMT_ALLOW, process.env.EMT_DENY]
					.includes(reaction.emoji.name) && author.id === message.author.id; };
	
				msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
				.then(collected => {
					const reaction = collected.first();
					if(reaction.emoji.name === process.env.EMT_ALLOW) resolve();
					else exit('I see, message purging cancelled.');
				}).catch(() => exit('I\'m sorry, it took too long for any reaction.'));

				function exit(a) {					
					message.reply(a).then(replyMsg => {								
						msg.delete(100);
						replyMsg.delete(10000);
						message.delete(10000);
						resolve('exit');
					});			
				}
			}
		}


		await message.channel.bulkDelete(args[0], true).then(msgs => {
			let send = `Successfully deleted ${msgs.size} messages.\n` +
				'This message will be gone in 5 seconds.';
			if(msgs.size < args[0]) send += '\nI\'m sorry, but I can\'t delete messages older than 2 weeks.';
			message.channel.send(send)
			.then(msg => msg.delete(5000));
		});


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
		onlyAdmins: true,
		onlyGuilds: true,
		requireArgs: true
	},
	
	get help() {
		return {
			name: 'purge',
			aliases: ['delete', 'del'],
			category: 'Utils',
			description: 'Bulk delete messages.',
			usage: 'purge [quantity]'
		};
	}
};