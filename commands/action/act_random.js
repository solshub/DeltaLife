const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, args, p, conn, user, player}) => {
		let possibilities = [];		
		const random = client.data.get('random');
		Object.values(random).forEach(r => { possibilities.push(r); });


		if(chance.bool({likelihood: 10})) {
			let drugs, drinks;
			if(player.age > 15) drinks = true;
			if(player.age > 17) drugs = true;

			if(drinks || drugs) {
				let run = 'drink';
				if(drinks && drugs) { if(chance.bool({likelihood: 50})) run = 'drugs';  }
				if(run == 'drugs') return client.commands.get('drugs').run({client, message, args, conn, user, player});
				return client.commands.get('drink').run({client, message, args, conn, user, player});
			}			
		}


		let evt;
		do { evt = chance.pickone(possibilities); }
		while(checkAge() == 'repeat');

		function checkAge() {
			if(evt.age) {
				if(evt.age.min) if(player.age < evt.age.min) return 'repeat';
				if(evt.age.max) if(player.age > evt.age.max) return 'repeat';
			}
		}


		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)}'s random life event`,
				icon_url: message.author.avatarURL },
			fields: [],
			description: wordsPerLine(evt.msg, 'big')
		};

		let filters = [];

		if(evt.choices) {
			const emt = [ process.env.EMT_ONE, process.env.EMT_TWO,
				process.env.EMT_THREE, process.env.EMT_FOUR ];

			embed.fields[0] = { name: '', value: '' };
			embed.fields[0].name = 'React with...'

			let i = 0;
			evt.choices.forEach(c => {
				embed.fields[0].value += wordsPerLine(`\`${emt[i]}\` and ${c.msg}\n`);
				filters.push(emt[i]);
				i++;
			});

			if(embed.fields[0].value.endsWith('\n'))
			embed.fields[0].value = embed.fields[0].value.substring(0, embed.fields[0].value.length - 1);
		}

		let msg;
		await message.channel.send({ embed }).then(m => msg = m);


		let effects, done, choose;

		if(filters.length) {			
			if(filters[0]) await msg.react(filters[0]);
			if(filters[1]) await msg.react(filters[1]);
			if(filters[2]) await msg.react(filters[2]);
			if(filters[3]) await msg.react(filters[3]);
		
			const promiseB = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promiseB;			
			if(result == 'exit') return;
			effects = evt.choices[result].effects;
			choose = evt.choices[result].msg;
			done = evt.choices[result].done && evt.choices[result].done;
		} else effects = evt.effects;

		function waitReaction(resolve, reject) {
			const filter = (reaction, author) => {return filters
				.includes(reaction.emoji.name) && author.id === message.author.id; };

			msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
			.then(async collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_ONE:
						return resolve(0);
					case process.env.EMT_TWO:
						return resolve(1);
					case process.env.EMT_THREE:
						return resolve(2);
					case process.env.EMT_FOUR:	
						return resolve(3);
				}
			})
			.catch(() => {										
				message.reply('I\'m sorry, it took too long for any reaction.').then(replyMsg => {
					msg.delete(100);
					replyMsg.delete(10000);
					message.delete(10000);
					resolve('exit');
				});
			});
		}
		

		let stats = `${firstWord(player.name)} got `;
		if(typeof effects == 'object')
		if(Object.entries(effects).length) stats += await updateStats();

		async function updateStats() {
			let eff = { alts: [], effs: [] };
			await setAlts();
			
			eff.alts.forEach(a => { eff.effs.push({ eff: calcMaxMin(player[a.name] + a.alt), name: a.name }); });

			async function setAlts() {
				Object.entries(effects).forEach(e => {
					eff.alts.push({ alt: calcNear(e[1]), name: e[0] }) });
				return;
			}


			const promise = new Promise((resolve, reject) => { updateStats(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			async function updateStats(resolve, reject) {
				let query = 'UPDATE player SET ';
				query += await setQuery();
				query = query.substring(0, query.length - 2);
				query += ` WHERE id = ${player.id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });

				async function setQuery() {		
					let q = '';
					eff.effs.forEach(e => { q += `${e.name} = ${e.eff}, `; });
					return q;
				}
			}


			let str = '';
			eff.alts.forEach(a => {
				const comma = (eff.alts.indexOf(a) + 2 == eff.alts.length) ? ' & ' :
					(eff.alts.indexOf(a) + 1 == eff.alts.length) ? '' : ', ';
				str += ((a.alt > 0) ? '+' : '') + `${a.alt} ${a.name}` + comma });
			return str;

	
			function calcMaxMin(a, b = {}) {
				if(typeof b !== 'object') b = { min: 0, max: 100 };
				if(!b.min) b.max = 0; if(!b.max) b.max = 100;
	
				if(a > b.max) return b.max;
				if(a < b.min) return b.min;
				return a;
			}	
	
			function calcNear(a) {
				const min = a - 3;
				const max = a + 3;
				return chance.integer({ min, max });
			}
		}
		

		if(done) {
			await message.channel.send({ embed: {
				color: process.env.CLR_WARN,
				author: {
					name: `${firstWord(player.name)} choose to...\n` + wordsPerLine(choose),
					icon_url: message.author.avatarURL },
				description: wordsPerLine(done),
				footer: { text: stats }	
			} });

		} else await message.channel.send(`\`${stats}\``);
		

		await client.commands.get('achievs').run({ client, message, conn, user, achiev: 'random' });
	
		await client.commands.get('timeout')
		.run({client, message, p, conn, user, time: { set: 'random' }});

		
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
		onlyGuilds: true,
		player: true
	},
	
	get help() {
		return {
			name: 'random',
			aliases: ['event', 'random-event'],
			category: 'Action',
			description: 'Get your player into a random life event.',
			usage: 'random'
		};
	},

	get crime() {
		return {
			icon: process.env.EMT_FIGHT,
			effect: { struggle: true, looks: 10, health: 10 }
		};
	}
};
