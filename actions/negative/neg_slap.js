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
			name: 'slap',
			aliases: ['bitchslap', 'bitch-slap'],
			category: { "Social": "Mean 💢" },
			description: 'Slap another player.',
			usage: 'slap @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['slapped'],
			type: 'neg',
			value: 9
		};
	}
};