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
			name: 'tickle',
			aliases: [''],
			category: { "Social": "Friendly 💬" },
			description: 'Tickle another player',
			usage: 'tickle @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['is tickling'],
			type: 'pos',
			value: 6
		};
	}
};