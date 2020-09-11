const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, conn, player}) => {
		if(player.age <= 14) return message.reply(`I'm sorry. ${firstWord(player.name)} ` +
			`is too young for this kind of risky procedure. Try again once you're older.`)
		if(player.gender > 2) return message
			.reply(`${firstWord(player.name)} already did a surgery ` +
				'for gender reassignment before. You can\'t do it again.');		
		if(player.cash < 30000) return message.reply(`I'm sorry. ${firstWord(player.name)} ` +
			`is too poor for this kind of expensive procedure. Try saving at least $30k.`);

		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)} is thinking about surgery`,
				icon_url: message.author.avatarURL
			},
			description: 'You\'re currently a ',
			footer: { text: `${process.env.EMT_WARN} This action is permanent.\nYou\'ll become a transgender.` }
		}, msg;

		let gender = client.data.get('gender', player.gender);
		embed.description += `${gender.gender} ${gender.symbol}. Doing this will`;
		if(player.gender == 0) embed.description += 'randomly make you either a boy or a girl, ' +
									'whatever the doctor deems safer during surgery. ';
		if(player.gender == 1) embed.description += 'make you a girl. ';
		if(player.gender == 2) embed.description += 'make you a boy. ';
		embed.description += 'Are you really sure this is what you want?';

		let cost = calcNear(25000, 5000);
		if((player.cash * 0.4) > cost) {
			const maxCost = calcNear(75000, 5000);
			cost = ((player.cash * 0.4) > maxCost) ? maxCost : player.cash * 0.4; }

		embed.description = `${wordsPerLine(embed.description)}\n` +
			wordsPerLine(`Based on your wealth, this will cost you $${parseFloat(cost).toFixed(2)}.`);
		await message.channel.send({ embed }).then(m => msg = m);

		const result = await waitReaction();
		msg.delete(100);
		if(result == 'exit') return;

		async function waitReaction() {
			await msg.react(process.env.EMT_ALLOW);
			await msg.react(process.env.EMT_DENY);

			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function waitReaction(resolve, reject) {
				const filter = (reaction, user) => { return [process.env.EMT_ALLOW, process.env.EMT_DENY]
					.includes(reaction.emoji.name) && user.id === message.author.id; };
				msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']}).then(collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_ALLOW:
							return resolve();
						default:
							return exit('I see, gender reassignment procedure cancelled.');
					}
				})
				.catch(() => exit('I\'m sorry, it took too long for any reaction.'));
	
				async function exit(a) {
					await message.reply(a).then(reply => {
						message.delete(4000);
						reply.delete(4000);
						resolve('exit');
					});
				}
			}			
		}


		embed = {
			color: process.env.CLR_ACT_NEG,
			author: {
				name: `${firstWord(player.name)} tried gender reassigment`,
				icon_url: message.author.avatarURL
			},
		}

		if(chance.bool({ likelihood: 50 })) {
			await updatePlayer();
			embed.description = 'The surgery was a success! Congratulations. ' +
				`You\'re a ${gender.gender} ${gender.symbol} now.`
		} else {
			embed.description = 'Oh no... the surgery didn\'t went well... I\'m sorry. ' +
				`You're still a ${gender.gender} ${gender.symbol}. Perhaps you should try again?` }
				
		embed.description = wordsPerLine(embed.description);
		
		async function updatePlayer() {
			if(player.gender == 0) player.gender = chance.pickone([3, 4]);
			if(player.gender == 1) player.gender = 4;
			if(player.gender == 2) player.gender = 3;
			gender = client.data.get('gender', player.gender);

			const promise = new Promise((resolve, reject) => { updatePlayer(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updatePlayer(resolve, reject) {
				conn.query(`UPDATE player SET gender = ${player.gender} WHERE id = ${player.id}`,
				function(error, results, fields) {
					if(error) throw error;
					resolve();
				})
			}
		}


		embed.footer = {};
		embed.footer.text = await updateStats(player.gender > 2);

		async function updateStats(add) {
			const val = [calcNear(15), calcNear(15), calcNear(5)];
			if(add) { player.happy += val[0]; player.health += val[1]; player.looks += val[2]; }
			else { player.happy -= val[0]; player.health -= val[1]; player.looks -= val[2]; }
			player.cash -= cost;

			const promise = new Promise((resolve, reject) => { updateStats(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updateStats(resolve, reject) {
				const query = `UPDATE player SET happy = ${player.health}, ` +
					`health = ${player.health}, looks = ${player.looks}, ` +
					`cash = ${parseFloat(player.cash).toFixed(2)} WHERE id = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve();
				})
			}

			return (`${((add) ? '+' : '-') + val[0]} happy, ${((add) ? '+' : '-') + val[1]} health, ` +
				`${((add) ? '+' : '-') + val[2]} looks, -$${cost}`);
		}


		message.channel.send({ embed });

		
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

		function calcNear(a, b) {
			const alter = (b) ? b : 2;
			const min = (a > 0 && (a - alter) <= 0) ? 1 : a - alter;
			const max = a + alter;
			return chance.integer({ min, max });
		}
	},	

	config: {
		player: true
	},
	
	get help() {
		return {
			name: 'reassign',
			aliases: ['surgery', 'genderbend', 'SRS', 'GRS', 'transgender', 'reassignment'],
			category: 'World',
			description: 'Go to a gender reassignment surgery.',
			usage: 'reassign'
		};
	}
};