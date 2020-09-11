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
			name: 'wink',
			aliases: ['wonk'],
			category: { "Social": "Romantic 💘" },
			description: 'Wink at another player.',
			usage: 'wink @[user] ignoreAge',
			
			interaction: true
		};
	},

	get action() {
		return {
			message: ['winked at'],
			request: ['wink at'],
			type: 'rom',
			value: 3
		};
	}
};