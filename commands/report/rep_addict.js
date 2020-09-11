const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, args, p, conn, user, player, addict}) => {		
		// addict = { set: '', value: 0 };

		const addicts = client.data.get('addict');

		if(typeof addict === 'object') {
			if(!addict.value) addict.value = 1;
			
			const promise = new Promise((resolve, reject) => { updateYearly(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;


			const addicted = Object.values(addicts).find(a => a.set == addict.set);

			const limit = (addict.set == 'gamble') ? 5 : 3;
			if(player.yearly[addict.set] >= limit && !player.addict[addict.set]) {
				if(!chance.bool({likelihood: (player.yearly[addict.set] * 10)}))
					await message.reply(`${process.env.EMT_WARN}` +
					`Perhaps you should ${addicted.advice} a little less...`);
				else {
					const promise = new Promise((resolve, reject) => { updateAddicts(resolve, reject); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					await promise;
					
					await message.reply('it just happened to you...\n' +
					`${process.env.EMT_WARN} You\'re definitely addicted to ${addicted.msg}.`);
				}
			}

			return;
		}

		function updateYearly(resolve, reject) {
			player.yearly[addict.set] += addict.value;
			let query = 'UPDATE yearly ' +
				`SET ${addict.set} = ${player.yearly[addict.set]} ` +
				`WHERE player = ${player.id}`;
			conn.query(query, function(error, results, fields) {				
				if(error) throw error;
				resolve();
			}).on('error', err => { sqlHandle(err); });
		}

		function updateAddicts(resolve, reject) {
			player.addict[addict.set] = true;
			const query = `UPDATE addict SET ${addict.set} = ${player.addict[addict.set]} ` +
				`WHERE player = ${player.id}`;
			conn.query(query, function(error, results, fields) {
				if(error) throw error;
				resolve();
			}).on('error', err => { sqlHandle(err); });
		}

		
		let i = 0;
		const reacts = [process.env.EMT_ONE, process.env.EMT_TWO, process.env.EMT_THREE,
			process.env.EMT_FOUR, process.env.EMT_FIVE, process.env.EMT_SIX, process.env.SEVEN];
		let descs = [], addictions = [];
		Object.entries(player.addict).forEach(a => {
			if(a[1] === 0) return;
			a = Object.values(addicts).find(ad => ad.set == a[0]);
			if(typeof a == 'undefined') return;
			descs.push(`${reacts[i]} ${a.msg} ${a.symbol}`);
			addictions.push(`${a.set}`);
			i++;
		})

		if(!descs.length) return message.channel.send('You\'re not addicted to anything at the moment.');

		let embed = {
			color: process.env.CLR_HELP,
			author: { 
				name: `${firstWord(message.author.username)}'s addictions`,
				icon_url: message.author.avatarURL
			},
			description: 'You\'re addicted to...\n',
			footer: { text: 'Some addictions might kill you.' }
		}
		
		let preMsg;
		await message.channel.send('These are the things you\'re addicted to.\n' +
			'If you want to go to rehab, react with the corresponding number.').then(m => preMsg = m);

		embed.description += descs.join('\n');
		let msg, filters = [];
		await message.channel.send({ embed }).then(m => msg = m);
		if((i - 1) >= 0) { await msg.react(reacts[0]); filters.push(reacts[0]); }
		if((i - 1) >= 1) { await msg.react(reacts[1]); filters.push(reacts[1]); }
		if((i - 1) >= 2) { await msg.react(reacts[2]); filters.push(reacts[2]); }
		if((i - 1) >= 3) { await msg.react(reacts[3]); filters.push(reacts[3]); }
		if((i - 1) >= 4) { await msg.react(reacts[4]); filters.push(reacts[4]); }
		if((i - 1) >= 5) { await msg.react(reacts[5]); filters.push(reacts[5]); }
		if((i - 1) >= 6) { await msg.react(reacts[6]); filters.push(reacts[6]); }

		let result = await waitReaction();
		if(result == 'exit') return;

		await preMsg.delete(100);
		await msg.delete(100);
		client.commands.get('rehab').run({client, message, args, p, conn, user, player, treat: addictions[result]});

		async function waitReaction() {
			const cmdRehab = `\`${p}rehab [addiction]\``;

			const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			function waitReaction(resolve, reject) {				
				filter = (reaction, author) => { return filters
					.includes(reaction.emoji.name) && author.id === message.author.id; };

				msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					const index = reacts.findIndex(r => r == reaction.emoji.name);
					if(index >= 0) resolve(index);

				}).catch(async () => {
					msg.clearReactions();
					await preMsg.edit('It took too long for any reaction.\n' +
						`If you still want treatment, use ${cmdRehab}.`);
					resolve('exit');
				});
			}
		}


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
		onlyGuilds: true,
		player: true
	},
	
	get help() {
		return {
			name: 'addict',
			aliases: ['addicted', 'addicts', 'addictions', 'addiction'],
			category: 'Reports',
			description: 'Check your addictions.',
			usage: 'addict'
		};
	}
};