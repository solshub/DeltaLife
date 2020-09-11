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
			name: 'comfort',
			aliases: ['console'],
			category: { "Social": "Friendly 💬" },
			description: 'Make another player feel better',
			usage: 'comfort @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['comforted'],
			type: 'pos',
			value: 9
		};
	}
};