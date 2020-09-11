module.exports = {
	run: async ({message, p}) => {
		const cmdRevive = `\`${p}revive\``;
		const cmdSetAge = `\`${p}setAge\``;
		const cmdSetZodiac = `\`${p}setZodiac\``;
		const cmdUsage = `\`${p}usage\``;

		const embed = {
			color: process.env.CLR_HELP,
			title: 'Click here and check my patreon!',
			url: 'https://www.patreon.com/lifebotdiscord',
			thumbnail: { url: 'https://images2.imgbox.com/52/14/BlxyiVZV_o.png' },
			description: '**Hello. You can call me Jig.**\n' +
				'I\'m the brazilian creator of **DeltaLife**! ' +
				'I hope you\'ve been having a great time, ' +
				'it took me several months, and as my first big project, ' +
				'I put a lot of my heart into it.\n\n' +
				'If you want to give me your support, ' +
				'please consider becoming a patreon. I\'ve been putting this over ' +
				'many personal things. Any help would be of great help! ~~',
			fields: [
				{ name: 'Some privileges',
				value: `There are currently 3 premium commands: ${cmdRevive}, to revive any dead character, ` +
					`${cmdSetAge}, to become younger, and ${cmdSetZodiac}, ` +
					`to select your desired zodiac sign.` },
				{ name: 'Upcoming...',
				value: 'In the future, I plan to allow premium users ' +
					`to set their gender and country! See the last page of ${cmdUsage} ` +
					'to see what else I have in mind.' }
			]
		};

		await message.channel.send({ embed });
	},	

	config: {},
	
	get help() {
		return {
			name: 'patreon',
			aliases: [''],
			category: 'Utils',
			description: 'Become a patreon supporter! You\'ll help me a lot!',
			usage: 'patreon'
		};
	}
};