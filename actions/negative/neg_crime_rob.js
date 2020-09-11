module.exports = {run:({client, message, args, p, conn, cmd, mention, user, menUser, player, menPlayer, configs = {}})=> {
		client.commands.get('crime').run({client, message, args: [cmd.help.name], p, conn, mention, user, menUser, player, menPlayer, configs});
	},
	config: {
		mayMention: true,
		onlyGuilds: true,
		mention: true,
		menUser: true,
		mayPlayer: true,
		mayMenPlayer: true
	},
	
	get help() {
		return {
			name: 'rob',
			aliases: ['steal', 'loot', 'burgle'],
			category: { "Social": "Mean 💢" },
			description: 'Rob another player\'s money.',
			usage: 'rob @[user]',
			
			interaction: true
		};
	},

	get action() {
		return {
			icon: process.env.ICO_ROB,
			message: ['robbed'],
			type: 'neg',
			value: 12
		};
	},

	get crime() {
		return {
			icon: process.env.EMT_ROB,
			chance: 30,
			effect: { cash: 20 }
		};
	}
};