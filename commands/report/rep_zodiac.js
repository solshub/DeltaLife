module.exports = {
	run: async ({client, message, user}) => {
		let zodiac = client.data.get('zodiac', user.zodiac);
		zodiacs = client.data.get('zodiac');

		let relations = [];
		zodiac.partners.forEach(z => {
			const p = client.data.get('zodiac', z);
			relations.push(p.symbol);
		});

		let embed = {
			color: process.env.CLR_HELP,
			author: {
				name: `${zodiac.zodiac}'s horoscope ${zodiac.symbol}`,
				icon_url: message.author.avatarURL
			},
			description: wordsPerLine(zodiac.desc) +
				'\n`Good relations with ' + relations.join(' ') + '`',
			footer: { text: zodiac.bonus }
			// image: { url: 'https://i.imgur.com/SaKfoC6.png' }
		};

		message.channel.send({ embed });
		

		function wordsPerLine(a, b) {
			let perLine = 40;
			if(b == 'big') perLine = 50;
			if(b == 'small') perLine = 30;

			let str = [], i = 0;
			let words = a.split(' ');
			words.forEach(word => {
				if(!str[i]) str[i] = '';
				str[i] += word + ' ';

				if(str[i].length > perLine) {
					tmpStr = '';
					words.forEach(w => {
						if(words.indexOf(w) >= words.indexOf(word))
						tmpStr += w + ' '; });

					if(tmpStr.length > Math.round(perLine / 2.5))
					str[i] += '\n'; i++;
				}
			});
			
			str = [].concat.apply([], str);
			return str.join(' ');
		}
	},

	config: {
	},
	
	get help() {
		return {
			name: 'zodiac',
			aliases: ['horoscope'],
			category: 'Reports',
			description: 'Check your zodiac\'s horoscope',
			usage: 'zodiac'
		};
	}
};