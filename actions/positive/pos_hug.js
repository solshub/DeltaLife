module.exports = {run:({client, message, args, p, conn, cmd, mention, user, menUser, player, menPlayer, configs = {}})=> {
		client.commands.get('act').run({client, message, args: [cmd.help.name], p, conn, mention, user, menUser, player, menPlayer, configs});
	},
	config: {
		mention: true,
		onlyGuilds: true,
		menUser: true,
		mayPlayer: true,
		mayMenPlayer: true
	},
	
	get help() {
		return {
			name: 'hug',
			aliases: [''],
			category: { "Social": "Friendly 💬" },
			description: 'Hug another player.',
			usage: 'hug @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['hugged'],
			type: 'pos',
			value: 6
		};
	}
};