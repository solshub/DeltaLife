module.exports = {
	run:({client, message, cmd, p}) => {
		let embed = {
			color: process.env.CLR_HELP,
			title: 'Social commands',
			description: 'All of these require another user.\n' +
				'Use with \`!action [command] @[user]\`',
			footer: { text: `Actions marked with * are ${p}${process.env.CMD_ILLEGAL}, be careful!`+
				`\nUse ${p}${client.commands.get('help').help.usage} for details.` },
			fields: []
		};

		let categName = cmd.help.name.charAt(0).toUpperCase() + cmd.help.name.slice(1);
		let category = client.categories.get(categName);
		Object.keys(category).forEach(sub => {
			let value = '';
			client.categories.get(categName)[sub].forEach(cmd => {
				value += `**${process.env.PREFIX}${cmd}**`;
				const c = client.commands.get(cmd);
				if(c.crime) value += ' *';
				value += '\n';
			});

			embed.fields.push({ name: `**${sub}**`, value: value, inline: true });
		});

		if(!message.guild) return message.author.send({embed});
		message.channel.send({embed});
	},

	config: {
	},
	
	get help() {
		return {
			name: 'social',
			aliases: ['actions', 'interactions'],
			category: 'Support',
			description: 'List all social commands.',
			usage: 'social'
		};
	}
};