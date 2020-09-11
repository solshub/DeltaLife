const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({message, conn, player}) => {
		if(!player.marry) return message.reply('I\'m sorry, you\'re not even married yet.');

		const marry = await getMarry();

		async function getMarry() {
			const promise = new Promise((resolve, reject) => { getMarry(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function getMarry(resolve, reject) {
				conn.query(`SELECT * FROM player WHERE id = ${player.marry}`, function(error, results, fields) {
					if(error) throw error;
					resolve(results[0]);
				}).on('error', err => { sqlHandle(err); });
			}
		}

		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)}'s thinking about divorce`,
				icon_url: message.author.avatarURL },
			description: wordsPerLine(`Are you really sure you want to end your marriage with ${marry.name}?`)
		}, msg;

		await message.channel.send({embed}).then(m => msg = m);

		const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		if(result == 'exit') return;

		async function waitReaction(resolve, reject) {
			await msg.react(process.env.EMT_ALLOW);
			await msg.react(process.env.EMT_DENY);

			filter = (reaction, author) => { return [process.env.EMT_ALLOW, process.env.EMT_DENY]
				.includes(reaction.emoji.name) && author.id === message.author.id; };	

			msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
			.then(collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_ALLOW:		
						return resolve();
					case process.env.EMT_DENY:
						return exit('I see, divorce request cancelled.');
				}
			}).catch(() => exit('I\'m sorry, it took too long for any reaction.'));

			async function exit(a) {
				await message.reply(a).then(replyMsg => {
					preMsg.delete(100);
					msg.delete(100);
					replyMsg.delete(10000);
					message.delete(10000);
					resolve('exit');
				});
			}
		}


		embed = {
			color: process.env.CLR_ACT_NEG,
			author: {
				name: `${firstWord(player.name)} divorced from ${firstWord(marry.name)}`,
				icon_url: message.author.avatarURL },
			description: wordsPerLine('The divorce papers were fullfiled... ' +
				'They are both single now. Every good thing must come to an end.'),
			footer: {}
		}

		const val = { happy: [calcNear(10), calcNear(10)], social: [calcNear(10), calcNear(10)] };
		embed.footer.text = await updatePlayer();

		async function updatePlayer() {
			player.happy = calcMaxMin(player.happy - val.happy[0]);
			player.social = calcMaxMin(player.social - val.social[0]);
			marry.happy = calcMaxMin(marry.happy - val.happy[1]);
			marry.social = calcMaxMin(marry.social - val.social[1]);

			function calcMaxMin(a, b = {}) {
				if(typeof b !== 'object') b = { min: 0, max: 100 };
				if(!b.min) b.min = 0; if(!b.max) b.max = 100;

				if(a > b.max) return b.max;
				if(a < b.min) return b.min;
				return a;
			}

			const promise = new Promise((resolve, reject) => { updatePlayer(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updatePlayer(resolve, reject) {
				let query = `UPDATE player SET marry = NULL, happy = ${player.happy}, ` +
					`social = ${player.social} WHERE id = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;

					query = `UPDATE player SET marry = NULL, happy = ${marry.happy}, ` +
						`social = ${marry.social} WHERE id = ${marry.id}`;
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
						resolve();
					}).on('error', err => { sqlHandle(err); });
				}).on('error', err => { sqlHandle(err); });
			}

			const str = `${firstWord(player.name)} got -${val.happy[0]} happy & -${val.social[0]} social` +
				`\n${firstWord(marry.name)} got -${val.happy[1]} happy & -${val.soicial[1]} social`;
			return str;
		}

		
		message.channel.send({ embed });


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function calcNear(a, b) {
			if(!b) b = 3;
			const min = (a > 0 && (a - b) <= 0) ? 1 : a - b;
			const max = a + b;
			return chance.integer({ min, max });
		}

		function firstWord(str) {
			const arr = str.split(" ");
			return arr[0];
		}
		
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

	config: { player: true },
	
	get help() {
		return {
			name: 'divorce',
			aliases: [''],
			category: 'Character',
			description: 'Bring an end to your marriage.',
			usage: 'divorce'
		};
	}
};