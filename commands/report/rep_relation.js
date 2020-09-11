module.exports = {
	run: async ({client, message, conn, mention, user, menUser}) => {
		let embed = {
			color: process.env.CLR_HELP,
			author: {
				name: `${firstWord(message.author.username)} & ${firstWord(mention.username)}'s relation`,
				icon_url: message.author.avatarURL
			},
			fields: []
		};


		const promise = new Promise((resolve, reject) => { getRelationData(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const rel = await promise;

		async function getRelationData(resolve, reject) {
			let order;
			if(user.id > menUser.id) order = [menUser.id, user.id];
			else order = [user.id, menUser.id];

			const promiseA = new Promise((resolve, reject) => { getRelation(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			let result = await promiseA;
			if(result) return resolve(result);
			
			const id = await insert();
			const promiseB = new Promise((resolve, reject) => { getRelation(resolve, reject, id); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			result = await promiseB;
			resolve(result);


			function getRelation(resolve, reject, insertId) {
				let query = 'SELECT * FROM relation WHERE ';
				if(insertId) query += `id = ${insertId}`;
				else query += 'userA = ? AND userB = ?';
				conn.query(query, order, function(error, results, fields) {
					if(error) throw error;
					resolve(results[0]);
				}).on('error', err => { sqlHandle(err); });
			}

			async function insert() {
				const promise = new Promise((res, rej) => { insert(res, rej); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				tmpId = await promise;
				return tmpId;

				function insert(resolve, reject) {
					conn.query('INSERT INTO relation(userA, userB) VALUES (?, ?)', order, function(error, results, fields) {
						if(error) throw error;
						resolve(results.insertId);
					}).on('error', err => { sqlHandle(err); });
				}
			}
		}


		let title = client.data.get('title', rel.title);
		embed.description = `They are each other's ${title.relate}!`;		


		const log = calcScores();

		embed.fields.push({ name: "Friendship 👋", value: `${rel.friend} friend points\n${(log.friend) ? log.friend : ''}`, inline: true });
		embed.fields.push({ name: "Romance ❤️", value: `${rel.love} love points\n${(log.love) ? log.love : ''}`, inline: true });

		function calcScores() {
			let f, l;
			if(rel.friend > 0)  f = calcScore(false, rel.friend, '💬');
			else f = calcScore(true, rel.friend, '💢');
			l = calcScore(false, rel.love, '💘');
			return { friend: f, love: l };

			function calcScore(neg, a, b) {
				let i, str = '';
				for(i = (neg) ? -10 : 10; (neg) ? i >= a : i <= a; i = (neg) ? i - 10 : i + 10) {
					str += b;
					if(i == 50 || i == -50) str += '\n';
				}
				for(i; (neg) ? i >= -100 : i <= 100; i = (neg) ? i - 10 : i + 10) {
					str += '✖️';
					if(!str.includes('\n')) if(i == 50 || i == -50) str += '\n';
				}
				if(str) return `\`\`\`${str}\`\`\``;
			}
		}
		

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
	},	

	config: {
		mention: true,
		menUser: true
	},
	
	get help() {
		return {
			name: 'relation',
			aliases: ['rel', 'love', 'friend', 'friendship'],
			category: 'Reports',
			description: 'Check your relation with another player.',
			usage: 'relation @[user]'
		};
	}
};