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
			name: 'prank',
			aliases: ['trick', 'mischief'],
			category: { "Social": "Mean 💢" },
			description: 'Prank another player.',
			usage: 'prank @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['played a prank on'],
			type: 'neg',
			value: 3
		};
	}
};