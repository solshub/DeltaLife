module.exports = {
	run: async ({message, conn}) => {
		promise = new Promise((resolve, reject) => { getPlayers(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		if(!result.length) return message.reply('I\'m sorry, there are not enough players.');

		function getPlayers(resolve, reject) {
			const query = 'SELECT p.name, p.age, u.user FROM player p, user u ' +
				'WHERE p.user = u.id ORDER BY age DESC LIMIT 10';
			conn.query(query, function(error, results, fields) {
				if(error) throw error;
				resolve(results);
			}).on('error', err => { sqlHandle(err); });
		}

		let embed = {
			color: process.env.CLR_HELP,
			author: {
				name: 'Oldest characters leaderboard',
				icon_url: process.env.ICO_TROPHY
			},
			description: '\`User, character\'s age and name:\`',
			timestamp: new Date()
		};

		for(let i = 0; i < result.length; i++) {
			embed.description += `\n**${i + 1}.** <@!${result[i].user}>'s ${result[i].age} years old ${result[i].name}`; }
		
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
			name: 'oldest',
			aliases: [''],
			category: 'Online',
			description: 'Check the top 10 oldest players.',
			usage: 'oldest'
		};
	}
};