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
			name: 'praise',
			aliases: ['compliment'],
			category: { "Social": "Friendly 💬" },
			description: 'Praise another player',
			usage: 'praise @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['complimented'],
			type: 'pos',
			value: 6
		};
	}
};