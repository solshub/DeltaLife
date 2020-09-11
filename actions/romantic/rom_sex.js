module.exports = {run:({client, message, args, p, conn, cmd, mention, user, menUser, player, menPlayer, configs = {}})=> {
		args = args.join(' ').toLowerCase();
		const rom = {
			safeSex: args.includes('safe'),
			ignoreAge: args.includes('ignoreage') || args.includes('ignore-age') || args.includes('ignore age')
		}
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
			name: 'sex',
			aliases: ['fuck', 'make-love', 'go-to-bed-with', 'child', 'impregnate', 'copulate'],
			category: { "Social": "Romantic 💘" },
			description: 'Go to bed with another player.',
			usage: 'sex @[user] safe ignoreAge',

			notSfw: true,
			interaction: true
		};
	},

	get action() {
		return {
			icon: process.env.ICO_LOVE,
			message: ['had sex with'],
			request: ['go to bed with'],
			type: 'rom',
			value: 21
		};
	}
};