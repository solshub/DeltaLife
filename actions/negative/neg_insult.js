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
			name: 'insult',
			aliases: ['jeer'],
			category: { "Social": "Mean 💢" },
			description: 'Insult another player.',
			usage: 'insult @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['called', 'names'],
			type: 'neg',
			value: 6
		};
	}
};