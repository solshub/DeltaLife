const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, p, conn, user, player, birth}) => {
		if(birth) {
			if(chance.bool({ likelihood: 10 })) {
				return message.channel.send(`${process.env.EMT_WARN} Oh no... ` +
					'It look\'s like something went wrong during birth... '+
					`${firstWord(player.name)} lost it\'s baby.`) }

			let embed = {
				color: process.env.CLR_WARN,
				author: {
					name: `${firstWord(player.name)} naming it's child`,
					icon_url: message.author.avatarURL },
				description: `Are you really sure you want to name your baby ${birth} as ${name}?`,
			}

			let preMsg, msg;
			let name, result;
			do {
				if(preMsg) preMsg.delete(100);
				if(msg) msg.delete(100);
				name = await waitInput();
				result = await confirmInput();
			} while(result == 'repeat');
			
			async function waitInput() {
				await message.channel.send(`${process.env.EMT_WARN} Please ` +
					`enter what you want your children\'s name to be! ${process.env.EMT_WARN} ` +
					'In case you dont say anything, a random name will be entered.');

				const promise = new Promise((resolve, reject) => { waitInput(a, resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				const result = await promise;
				return result;
				
				async function waitInput(resolve, reject) {
					filter = (response, user) => { return user.id === message.author.id; };
	
					await message.channel.send({ embed }).then(m => msg = m);
					
					await message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
					.then(async collected => {
						const temp = collected.first().content;
						if(temp.length > 17) {
							await message.reply('Please choose a shorter name!');
							return resolve('repeat'); }
						resolve(temp);

					}).catch(async collected => {
						const temp = chance.name({
							gender: ((birth == 'boy') ? 'male' : 'female'),
							nationality: 'en' });
						await message.channel.send('You didn\'t input anything.' +
							`Your baby\'s name is going to be... ${temp}`);
						resolve(temp);
					});
				}
			}

			async function confirmInput() {
				await message.channel.send(`React with ${process.env.EMT_ALLOW} ` +
					`to confirm, or with ${process.env.EMT_DENY} to enter another name.` +
					'If you dont react in 30 seconds, the name will be automatically confirmed.').then(m => preMsg = m);
				await message.channel.send('').then(m => msg = m);

				const promise = new Promise((resolve, reject) => { confirmInput(a, resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				const result = await promise;
				return result;
				
				async function confirmInput(resolve, reject) {
					filter = (reaction, author) => { return filters
						.includes(reaction.emoji.name) && author.id === message.author.id; };

					await msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
					.then(async collected => {
						const reaction = collected.first();
						switch(reaction.emoji.name) {
							case process.env.EMT_ALLOW:
								return resolve();
							case process.env.EMT_DENY:		
								return resolve('repeat');
						}
					})
					.catch(async () => {
						await preMsg.edit('It took too long for any reaction.\n' +
							'The name was automatically confirmed.');
						await msg.clearReactions();
						resolve();
					});
				}
			};


			await client.commands.get('achievs')
			.run({client, message, conn, user, player, achiev: 'child'});

			let img, cost, birth;
			const promise = new Promise((resolve, reject) => { insertChildren(a, resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			result = await promise;

			async function insertChildren(resolve, reject) {
				img = chance.pickone(client.images.get('children', birth));
				cost = chance.integer({ min: 10000, max: 15000 });

				let query = `INSERT INTO children(parentA, parentB, gender, name, img, cost) ` +
					`VALUES(${player.preg}, ${player.id}, ${((birth == 'boy') ? 1 : 2)}, ?, ?, ?)`;
				conn.query(query, [name, img, parseFloat(cost).toFixed(2)], function(error, results, fields) {
					if(error) throw error;

					conn.query(`SELECT birth FROM children WHERE id = ${results.insertID}`,
					function(error, results, fields) {
						if(error) throw error;
						birth = moment(results[0].birth, "YYYY-MM-DD HH-MM-SS").format('LL');

						const val = [10, 10];
						player.happy = calcMaxMin(val[0]);
						player.social = calcMaxMin(val[1]);
						player.preg = NULL;
						query = `UPDATE player SET preg = NULL, happy = ${player.happy}, ` +
							`social = ${player.social} WHERE player = ${player.id}`
						conn.query(query, function(error, results, fields) {
							if(error) throw error;							
							resolve(`+${val[0]} happy, +${val[1]} social, +1 child`);
						}).on('error', err => { sqlHandle(err); });

					}).on('error', err => { sqlHandle(err); });
				}).on('error', err => { sqlHandle(err); });


				function calcMaxMin(a, b = {}) {
					if(typeof b !== 'object') b = { min: 0, max: 100 };
					if(!b.min) b.min = 0; if(!b.max) b.max = 100;

					if(a > b.max) return b.max;
					if(a < b.min) return b.min;
					return a;
				}
			}


			embed = {
				color: process.env.CLR_ACT_POS,
				author: {
					name: `${firstWord(name)} was born!`,
					icon_url: message.author.avatarURL },
				description: `Congratulations! Your baby ${birth} was born ` +
					`and named ${name}, at the date of ${birth}.`,
				thumbnail: { url: img },
				footer: { text: `It will cost $${parseFloat(cost).toFixed(2)} anually` + `\n${result}` }
			}

			await message.channel.send({ embed });
			

			return;
		}

		const cmdCopulate = `${p}copulate`;

		const gender = client.data.get('gender', player.gender);
		if(!gender.details.getpreg) return message.reply(`I\'m sorry, you\'re a ${gender.gender}! You can\'t get pregnant.`);

		let embed = {
			color: process.env.CLR_ACT_NEG,
			author: {
				name: `${firstWord(player.name)} did a pregnancy test`,
				icon_url: message.author.avatarURL },
			description: wordsPerLine('Hmm... ' +
				'It doesn\'t look like you\'re pregnant at the moment. ' +
				`Have you tried to ${cmdCopulate} with a male player?`)
		}

		if(player.preg) {
			player.preg.user = await getUser();

			embed.color = process.env.CLR_ACT_POS;
			embed.description = wordsPerLine('**Congratulations**! ' +
				'You really are pregnant! It will be born next year, and ' +
				`it\'s father ${firstWord(player.preg.name)}\n`) +
				`The father's user is <@!${player.preg.user}>.`;
		}

		async function getUser() {
			const promise = new Promise((resolve, reject) => { getUser(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function getUser(resolve, reject) {
				conn.query(`SELECT user FROM user WHERE id = ${player.user}`, 
				function(error, results, fields) {
					if(error) throw error;
					resolve(results[0].user);
				}).on('error', err => { sqlHandle(err); });
			}
		}


		await message.channel.send({ embed });


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
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

	config: {
		player: true
	},
	
	get help() {
		return {
			name: 'pregnant',
			aliases: ['pregnancy', 'pregananant', 'mother'],
			category: 'Reports',
			description: 'Check if you\'re pregnant!',
			usage: 'pregnant'
		};
	}
};