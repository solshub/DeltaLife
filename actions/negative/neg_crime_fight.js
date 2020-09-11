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
			name: 'fight',
			aliases: ['attack', 'beat', 'beat-up', 'punch'],
			category: { "Social": "Mean 💢" },
			description: 'Fight with another player.',
			usage: 'fight @[user]',

			notSfw: true,
			interaction: true
		};
	},

	get action() {
		return {
			icon: process.env.ICO_FIGHT,
			message: ['attacked'],
			type: 'neg',
			value: 12,
		};
	},

	get crime() {
		return {
			icon: process.env.EMT_FIGHT,
			chance: 90,
			effect: { struggle: true, looks: 10, health: 10 }
		};
	}
};