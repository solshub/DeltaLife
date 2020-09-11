module.exports = {
	run:({client, message, args, conn, p, cmd, mention, user, menUser, player, menPlayer, configs = {}})=> {
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
			name: 'stab',
			aliases: ['hurt'],
			category: { "Social": "Mean 💢" },
			description: 'Stab another player.',
			usage: 'stab @[user]',

			notSfw: true,
			interaction: true
		};
	},

	get action() {
		return {
			icon: process.env.ICO_STAB,
			message: ['stabbed'],
			type: 'neg',
			value: 12
		};
	},

	get crime() {
		return {
			icon: process.env.EMT_STAB,
			chance: 50,
			effect: { looks: 15, health: 15 }
		};
	}
};