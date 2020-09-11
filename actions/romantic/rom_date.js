module.exports = {run:({client, message, args, p, conn, cmd, mention, user, menUser, player, menPlayer, configs = {}})=> {
	args = args.join(' ').toLowerCase();
	const rom = { ignoreAge: args.includes('ignoreage') || args.includes('ignore-age') || args.includes('ignore age') }
		client.commands.get('act').run({client, message, args: [cmd.help.name], p, conn, mention, user, menUser, player, menPlayer,  rom, configs});
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
			name: 'date',
			aliases: ['date with'],
			category: { "Social": "Romantic 💘" },
			description: 'Take another player out on a date.',
			usage: 'date @[user] ignoreAge',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['took', 'out on a date'],
			request: ['date with'],
			type: 'rom',
			value: 9
		};
	}
};