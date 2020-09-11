module.exports = {
	run:({client, message, args, p, conn, cmd, mention, user, menUser, player, menPlayer, configs = {}})=> {
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
			name: 'argue',
			aliases: [''],
			category: { "Social": "Mean 💢" },
			description: 'Argue with another player.',
			usage: 'argue @[user]',

			interaction: true
		};
	},

	get action() {
		return {
			message: ['argued with'],
			type: 'neg',
			value: 6
		};
	}
};