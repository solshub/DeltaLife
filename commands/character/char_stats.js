module.exports = {
	run: async ({message, p, player}) => {
		const cmdProfile = `\`${p}profile\``;

		let embed = {
			author: {
				name: player.name,
				icon_url: message.author.avatarURL
			},
			fields: [
				{ name: '**Cash** ' + process.env.EMT_CASH, value: `Bank balance: \`${cashSign(player.cash)}\``},
				{ name: '**`Happy ' + process.env.EMT_HAPPY + '`**', value: `${player.happy}/100`, inline: true },
				{ name: '**`Social ' + process.env.EMT_SOCIAL + '`**', value: `${player.social}/100`, inline: true },
				{ name: '\u200b', value: '\u200b', inline: true },
				{ name: '**`Health ' + process.env.EMT_HEALTH + '`**', value: `${player.health}/100`, inline: true },
				{ name: '**`Looks ' + process.env.EMT_LOOKS + '`**', value: `${player.smarts}/100`, inline: true },
				{ name: '**`Smarts ' + process.env.EMT_SMARTS + '`**', value: `${player.looks}/100`, inline: true },
			],
			footer: { text: `Player's age: **${player.age} years**\n` + 
				`Use ${cmdProfile} to check all your info.` },
		};

		if(player.active) embed.color = process.env.CLR_HELP;
		

		await message.channel.send({ embed });


		function cashSign(a) {
			return a >= 0 ? '$' + parseFloat(a).toFixed(2) : '-$' + parseFloat(a * -1).toFixed(2);
		}
	},

	config: {
		player: true
	},
	
	get help() {
		return {
			name: 'stats',
			aliases: ['status'],
			category: 'Character',
			description: 'Check on your character\'s stats.',
			usage: 'stats'
		};
	}
};