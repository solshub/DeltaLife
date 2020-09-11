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
			name: 'sorry',
			aliases: ['apologize', 'apology'],
			category: { "Social": "Friendly 💬" },
			description: 'Tell another player you\'re sorry',
			usage: 'sorry @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['apologized to'],
			type: 'pos',
			value: 3
		};
	}
};