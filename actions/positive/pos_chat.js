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
			name: 'chat',
			aliases: ['talk'],
			category: { "Social": "Friendly 💬" },
			description: 'Chat with another player.',
			usage: 'chat @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			icon: process.env.ICO_CHAT,
			message: ['is chatting with'],
			type: 'pos',
			value: 3
		};
	}
};