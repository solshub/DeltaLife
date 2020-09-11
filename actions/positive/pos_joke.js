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
			name: 'joke',
			aliases: ['laugh', 'pun'],
			category: { "Social": "Friendly 💬" },
			description: 'Tell another player a very bad joke',
			usage: 'joke @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['told', 'a joke'],
			type: 'pos',
			value: 3
		};
	}
};