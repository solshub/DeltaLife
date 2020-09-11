module.exports = {run:({client, message, args, p, conn, cmd, mention, user, menUser, player, menPlayer, configs = {}})=> {
	args = args.join(' ').toLowerCase();
	const rom = { ignoreAge: args.includes('ignoreage') || args.includes('ignore-age') || args.includes('ignore age') }
		client.commands.get('act').run({client, message, args: [cmd.help.name], p, conn, mention, user, menUser, player, menPlayer, rom, configs});
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
			name: 'give-rose',
			aliases: ['give-a-rose', 'give-flower', 'give-a-flower'],
			category: { "Social": "Romantic 💘" },
			description: 'Give another player a rose.',
			usage: 'give-rose @[user] ignoreAge',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['gave', 'a rose'],
			request: ['give a rose to'],
			type: 'rom',
			value: 3
		};
	}
};