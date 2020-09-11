module.exports = {
	run: async ({message, p}) => {
		const cmdReport = `\`${p}bug-report\``
		
		const embed = {
			color: process.env.CLR_HELP,
			title: 'Click here to join the support server',
			url: 'https://discord.gg/4pJt3XS',
			thumbnail: { url: 'https://images2.imgbox.com/52/14/BlxyiVZV_o.png' },
			description: 'Hello, do you need help?\n' +
				'With the link above, you can join DeltaLife\'s server. ' +
				'I\'ll try to quickly answer everyone who goes there ' +
				`needing any kind of help. Alternatively, you can use ${cmdReport} ` +
				'and directly send a report on any problem you find.\n\n' +
				'**Thank you a lot for using DeltaLife!**\n' +
				'Feel free to contact me, I keep my dms open. ',
		};

		await message.channel.send({ embed });
	},	

	config: {},
	
	get help() {
		return {
			name: 'support',
			aliases: ['server'],
			category: 'Utils',
			description: 'Check on DeltaLife\'s official server.',
			usage: 'support'
		};
	}
};