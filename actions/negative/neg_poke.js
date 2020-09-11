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
			name: 'poke',
			aliases: ['nudge'],
			category: { "Social": "Mean 💢" },
			description: 'Poke another player in a very annoying away.',
			usage: 'poke @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['poked'],
			type: 'neg',
			value: 3
		};
	}
};