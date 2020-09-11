module.exports = {
	run: async ({message, conn}) => {
		promise = new Promise((resolve, reject) => { getWinners(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		if(!result.length) return message.reply('I\'m sorry, there haven\'t been enough gamblers.');

		function getWinners(resolve, reject) {
			const query = 'SELECT u.user, (g.earnSlots + g.earnBlackjack + g.earnRoulette + g.earnCraps) AS sum ' +
				'FROM user u, gamble g, player p WHERE g.player = p.id AND p.user = u.id ' +
				'ORDER BY sum DESC LIMIT 10';
			conn.query(query, function(error, results, fields) {
				if(error) throw error;
				resolve(results);
			}).on('error', err => { sqlHandle(err); });
		}

		let embed = {
			color: process.env.CLR_HELP,
			author: {
				name: 'Gamblers leaderboard',
				icon_url: process.env.ICO_TROPHY },
			description: 'Total winnings don\'t include lottery.',
			timestamp: new Date()
		};

		for(let i = 0; i < result.length; i++) {
			embed.description += `\n**${i + 1}.** <@!${result[i].user}> won `+
				`**${(result[i].sum > 0) ? '' : '-'}$${numberWithSpaces(Math.abs(result[i].sum))}.00** in total` }
		
		message.channel.send({embed});


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function numberWithSpaces(a) {
			a = parseInt(a);
			return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }	
	},	

	config: {},
	
	get help() {
		return {
			name: 'gamblers',
			aliases: [''],
			category: 'Online',
			description: 'Check the top 10 users who won the most while gambling.',
			usage: 'gamblers'
		};
	}
};