module.exports = {
	run: async ({message, conn}) => {
		promise = new Promise((resolve, reject) => { getPlayers(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		if(!result.length) return message.reply('I\'m sorry, there are not enough players.');

		function getPlayers(resolve, reject) {
			const query = 'SELECT user, sex FROM user ORDER BY sex DESC LIMIT 10';
			conn.query(query, function(error, results, fields) {
				if(error) throw error;
				resolve(results);
			}).on('error', err => { sqlHandle(err); });
		}

		let embed = {
			color: process.env.CLR_HELP,
			author: {
				name: 'Dirtiest users leaderboard',
				icon_url: process.env.ICO_TROPHY
			},
			description: 'It only counts if it\'s with another user.',
			timestamp: new Date()
		};

		for(let i = 0; i < result.length; i++) {
			embed.description += `\n**${i + 1}.** <@!${result[i].user}> has ` +
				`had sex ${result[i].sex} times.` }
		
		message.channel.send({embed});


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}
	},	

	config: {},
	
	get help() {
		return {
			name: 'dirtiest',
			aliases: [''],
			category: 'Online',
			description: 'Check the top 10 dirtiest users.',
			usage: 'dirtiest'
		};
	}
};