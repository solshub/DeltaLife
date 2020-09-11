module.exports = {
	run:({client, message, args, cmd, p}) => {
		if(args.length) if(client.commands.has(args[0])) {
			const command = client.commands.get(args[0]);
			if(command.crime) return client.commands.get('help')
				.run({client, message, args: [command.help.name], cmd, p});
		}
	
		let embed = {
			color: process.env.CLR_HELP,
			title: 'Illegal commands',
			description: '',
			footer: { text: `Use ${p}${client.commands.get('help').help.name} for details.` },
			fields: []
		};

		const category = client.categories.get('Social', 'Mean 💢');
		category.forEach(cmd => {
			const c = client.commands.get(cmd);
			if(!embed.description) embed.description += 'Careful with those.';
			else embed.description += '\n';
			if(c.crime) embed.description += `**${process.env.PREFIX + cmd}** ${c.crime.icon}`
				+ ` *odds: ${c.crime.chance || '100'}%*`;
		});
		
		if(!message.guild) return message.author.send({embed});
		message.channel.send({embed});
	},

	config: {},
	
	get help() {
		return {
			name: 'crimes',
			aliases: ['criminal', 'illegal'],
			category: 'Support',
			description: 'List all illegal social commands.',
			usage: 'crimes'
		};
	}
};