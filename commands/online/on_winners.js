const moment = require('moment');

module.exports = {
	run: async ({message, conn}) => {
		promise = new Promise((resolve, reject) => { getWinners(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		if(!result.length) return message.reply('I\'m sorry, there haven\'t been enough winners.');

		function getWinners(resolve, reject) {
			const query = 'SELECT p.name, u.user, l.lottery, l.won FROM player p, user u, lottery l ' +
				'WHERE winner IS NOT NULL AND l.winner = p.id AND p.user = u.id ' +
				'ORDER BY lottery DESC LIMIT 10';
			conn.query(query, function(error, results, fields) {
				if(error) throw error;
				resolve(results);
			}).on('error', err => { sqlHandle(err); });
		}

		let embed = {
			color: process.env.CLR_HELP,
			author: {
				name: 'Lottery winners leaderboard',
				icon_url: process.env.ICO_TROPHY },
			description: '\`User, characters\'s name and prize\`',
			timestamp: new Date()
		};

		for(let i = 0; i < result.length; i++) {
			embed.description += `\n**${i + 1}.** <@!${result[i].user}>'s ${firstWord(result[i].name)}\n` +
				`won **$${numberWithSpaces(result[i].lottery)}.00** at ${moment(result[i].won, "YYYY-MM-DD HH-MM-SS").format('LL')}` }
		
		message.channel.send({embed});


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function firstWord(str) {
			const arr = str.split(" ");
			return arr[0];
		}

		function numberWithSpaces(a) {
			a = parseInt(a);
			return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }	
	},	

	config: {},
	
	get help() {
		return {
			name: 'winners',
			aliases: [''],
			category: 'Online',
			description: 'Check the top 10 lottery winners.',
			usage: 'winners'
		};
	}
};