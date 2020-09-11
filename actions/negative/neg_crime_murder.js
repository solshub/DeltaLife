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
			name: 'murder',
			aliases: ['kill'],
			category: { "Social": "Mean 💢" },
			description: 'Attempt to murder another player.',
			usage: 'murder @[user]',

			notSfw: true,
			interaction: true
		};
	},

	get action() {
		return {
			icon: process.env.ICO_KILL,
			message: ['murdered'],
			type: 'neg',
			value: 50,
		};
	},

	get crime() {
		return {
			icon: process.env.EMT_KILL,
			chance: 10,
			effect: { murder: 10 }
		};
	}
};