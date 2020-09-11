module.exports = {
	run: async ({client, message, args, p, conn, user, player}) => {
		if(!player.sick.length) return await message.channel.send('You\'re not sick at the moment.');


		let preMsg;
		await message.channel.send('If you want to treat any of your diseases,\n' +
			'react with it\'s corresponding number.').then(m => preMsg = m);

		let embed = {
			color: process.env.CLR_HELP,
			author: {
				name: `${firstWord(player.name)}'s diseases`,
				icon_url: message.author.avatarURL
			},
			description: 'You\'ve been diagnosed with...'
		};

		let excess = 0, i = 0;
		const reacts = [process.env.EMT_ONE, process.env.EMT_TWO, process.env.EMT_THREE];
		player.sick.forEach(s => {
			if(i < 3) {
				const sick = client.data.get('sick', s.sick);
				embed.description += `\n${sick.sick} ${reacts[i]}`;				
				i++;
			} else {
				excess++;
				embed.description += `... And ${excess} more.`
			}
		});

		let msg, filters = [];
		await message.channel.send({ embed }).then(m => msg = m);
		if((i - 1) >= 0) { await msg.react(reacts[0]); filters.push(reacts[0]); }
		if((i - 1) >= 1) { await msg.react(reacts[1]); filters.push(reacts[1]); }
		if((i - 1) >= 2) { await msg.react(reacts[2]); filters.push(reacts[2]); }

		let result = await waitReaction();
		if(result == 'exit') return;

		await preMsg.delete(100);
		await msg.delete(100);
		client.commands.get('doctor')
		.run({client, message, args, p, conn, user, player, treat: { sick: player.sick[result], player } });

		async function waitReaction() {
			const cmdDoctor = `\`${p}doctor [disease]\``;

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
					const index = reacts.findIndex(r => r == reaction.emoji.name);
					if(index >= 0) resolve(index);

				}).catch(async () => {
					msg.clearReactions();
					await preMsg.edit('It took too long for any reaction.\n' +
						`If you still want treatment, use ${cmdDoctor}.`);
					resolve('exit');
				});
			}
		}


		function firstWord(str) {
			const arr = str.split(" ");
			return arr[0];
		}
	},	

	config: {
		onlyGuilds: true,
		player: true
	},
	
	get help() {
		return {
			name: 'sick',
			aliases: ['sickness', 'disease', 'diseases'],
			category: 'Reports',
			description: 'Check your diseases.',
			usage: 'sick'
		};
	}
};