module.exports = {
	run: async ({message, conn}) => {
		promise = new Promise((resolve, reject) => { getPlayers(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		if(!result.length) return message.reply('I\'m sorry, there are not enough players.');

		function getPlayers(resolve, reject) {
			const query = 'SELECT user, alcohol FROM user ORDER BY alcohol DESC LIMIT 10';
			conn.query(query, function(error, results, fields) {
				if(error) throw error;
				resolve(results);
			}).on('error', err => { sqlHandle(err); });
		}

		let embed = {
			color: process.env.CLR_HELP,
			author: {
				name: 'Drunkest users leaderboard',
				icon_url: process.env.ICO_TROPHY
			},
			description: '',
			timestamp: new Date()
		};

		for(let i = 0; i < result.length; i++) {
			embed.description += `\n**${i + 1}.** <@!${result[i].user}> ` +
				`went drinking ${result[i].alcohol} times.` }
		
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
			name: 'drunkest',
			aliases: [''],
			category: 'Online',
			description: 'Check the top 10 drunkest users.',
			usage: 'drunkest'
		};
	}
};