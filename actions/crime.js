const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, args, p, conn, mention, user, menUser, player, menPlayer, configs = {}})=> {
		const cmdIllegal = `\`${p}${process.env.CMD_ILLEGAL}\``;
		const cmdCreate = `\`${p}${process.env.CMD_CREATE}\``;

		let act;
		if(client.commands.has(args[0])) {
			act = client.commands.get(args[0]);
			if(!act.crime) return message.reply(`I\'m sorry, this command is only meant for ${cmdIllegal} actions.`);
		} else return message.reply(`I couldn't find any ${cmdIllegal} action named \`${args.join(' ')}\`.`);

		let crime = { redirect: true, able: false, killed: false, description: '' }, happiness;		
		if(!player) crime = { noPlayer: `For full usage of this command, you should first ${cmdCreate} a character.` };
		else if(!menPlayer) crime = { noPlayer: `For full usage of this command, your mention should first ${cmdCreate} a character.` };

		if(crime.noPlayer) await message.channel.send(crime.noPlayer);
		else {
			let percent = { min: 0, max: 100 };
			if(user.zodiac == 7) percent = { min: 0, max: 80 };
	
			const probability = (act.crime.chance) ? act.crime.chance : 100;
			if(probability <= chance.integer(percent)) {
				crime.able = true;
				let error;
				if(act.crime.effect) error = await effects();
				if(error) {
					if(error.includes('toopoor')) {
						const desc = `${firstWord(menPlayer.name)}'s too poor for you to do that! ` +
							'Go take someone else\'s money or something!';
						return message.channel.send({embed: { description: wordsPerLine(desc), color: process.env.CLR_WARN }}); }
					return message.reply(error);
				}
			}
		}

		async function effects() {
			if(act.crime.effect.murder) {
				if(configs['toggleKill'])
				if(chance.bool({ likelihood: act.crime.effect.murder })) {
					crime.killed = true;			
					crime.description = `${process.env.emt_WARN} ${firstWord(player.name)} killed ${firstWord(menPlayer.name)}!`;
					return;
				}
				crime.able = false;
			}


			let queryUser = '', queryMen = '', lossUser = [], lossMen = [];

			happiness = calcNear(20);
			if(act.crime.effect.cash) {
				if(menPlayer.cash <= 50) return 'toopoor';
				const loss = calcValues('cash'); calcHappiness(loss);
			}
			calcValues('happy');

			if(act.crime.effect.looks) calcValues('looks');
			if(act.crime.effect.health) calcValues('health');

			function calcValues(categ) {
				if(categ == 'cash') val = act.crime.effect.cash;
				if(categ == 'happy') val = happiness;
				if(categ == 'looks') val = act.crime.effect.looks;
				if(categ == 'health') val = act.crime.effect.health;
				const tmpPlayer = [menPlayer[categ], player[categ]];
				
				let tmpLoss, tmpLossMen, tmpLossUser, tmpGainLossUser;

				if(categ == 'cash') {
					if(tmpPlayer[0] < (tmpPlayer[1] * 2)) val = val / 2;
					tmpLoss = tmpPlayer[0] * (val / 100);					
					tmpLoss = parseFloat(tmpLoss).toFixed(2);
					tmpLossMen = parseFloat(tmpPlayer[0] - tmpLoss).toFixed(2);
					tmpGainLossUser = parseFloat(tmpPlayer[1] + tmpLoss).toFixed(2);
				} else {
					tmpLoss = (categ == 'happy') ? val : calcNear(val);
					tmpLossMen = calcLoss(tmpPlayer[0], tmpLoss, 0);

					tmpLossUser = tmpLoss - Math.round(tmpLoss * 0.40);
					if(categ == 'happy') tmpGainLossUser = calcGain(tmpPlayer[1], tmpLoss, 100);
					else if(act.crime.effect.struggle) tmpGainLossUser = Math.round(calcLoss(tmpPlayer[1], tmpLossUser, 0));
				}

				queryMen += `${categ} = ${tmpLossMen}, `;
				if(act.crime.effect.struggle || categ == 'cash' || categ == 'happy') queryUser += `${categ} = ${tmpGainLossUser}, `;

				if(categ == 'cash') {
					if(tmpLossMen != 0) lossMen.push(`$${tmpLoss}`);
					if(tmpGainLossUser != 0) lossUser.push(`$${tmpLoss}`);
					return tmpLoss;
				} else {
					if(categ !== 'happy') {
						if(tmpLossMen != 0) lossMen.push(`${tmpLoss} ${categ}`);
						if(act.crime.effect.struggle) if(tmpGainLossUser != 0) lossUser.push(`${tmpLossUser} ${categ}`);
					}
				}
			}

			function calcHappiness(loss) {
				if(loss > player.cash) happiness = calcGain(happiness, 20, 50);
				else if(loss > (parseFloat(player.cash * 0.75).toFixed(2))) happiness = calcGain(happiness, 15, 40);
				else if(loss > (parseFloat(player.cash * 0.40).toFixed(2))) happiness = calcGain(happiness, 10, 35);
				else calcGain(happiness, 0, 25);				
			}


			if(queryMen && queryUser) {
				if(lossMen) {
					const descMen = updateDesc(lossMen, menPlayer, 'mention');
					if(descMen) crime.description += '> ' + descMen + ' 😢';
				}
				if(crime.description) crime.description += '\n> ';
				if(lossUser) {
					const descUser = updateDesc(lossUser, player, 'user');
					crime.description += descUser;
					crime.description += (descUser.includes('lost')) ? ', but did it anyway 😀' : ' 😀';
				}
				
				error = await updateValues(queryUser, player.id);
				if(error) return error;				
				error = await updateValues(queryMen, menPlayer.id);
				if(error) return error;
			} else console.log('It looks like something went wrong.');

			function updateDesc(a, b, categ) {
				let desc = '';
				for(let i = 0; i < a.length; i++) {
					if(b == player && (a[i].charAt(0) == '$' || a[i].includes('happy'))) {
						if(desc) desc += ` and gained `;
						else desc = `${b.name} gained `;
					} else {
						if(desc) desc += ((i + 1) == a.length) ? ' and ' : ', ';
						else desc += `${b.name} lost `;
					}
					desc += a[i];
				}
				if(!desc) {
					desc += b.name;
					if(categ == 'mention') desc += ' doesn\'t have any health to lose';
					if(categ == 'user') desc += ' got happy with what happened';
				}
				return desc;
			}

			async function updateValues(a, b) {
				if(a.endsWith(', ')) a = a.substring(0, a.length - 2);
				
				const promise = new Promise((resolve, reject) => { updateValues(resolve, reject); })
				.catch(e => { console.log(e); return 'I\'m sorry. Something went wrong'; });
				await promise;

				function updateValues(resolve, reject) {
					query = 'UPDATE player SET ' + a + ` WHERE id = ${b}`;
					conn.query(query, function(error, results, fields) {
						if(error) throw error;
						resolve();
					}).on('error', (err) => { sqlHandle(err); });
				}
			}
		}


		error = await getUsers();
		if(error) return message.reply(error);
		
		async function getUsers() {
			if(!user) {
				user = await getUsers(player.user);
				if(typeof user == 'string') if(user.includes('sorry')) return user; }
			if(!menUser) {
				menUser = await getUsers('menPlayer'.user);
				if(typeof user == 'string') if(menUser.includes('sorry')) return menUser; }

			async function getUsers(a) {
				const promise = new Promise((resolve, reject) => { getUsers(resolve, reject); })
				.catch(e => { console.log(e); return 'I\'m sorry. Something went wrong'; });
				return await promise;
	
				function getUsers(resolve, reject) {
					conn.query('SELECT * FROM user WHERE id = ?', [a], function(error, results, fields) {
						if(error) throw error;
						resolve(results[0]);
					}).on('error', (err) => { sqlHandle(err); });
				}
			}
		}

		
		callAction();
		if(user.zodiac == 7) {
			const zodiac = client.data.get('zodiac', user.zodiac);
			message.channel.send(`Looks like your zodiac ${zodiac.symbol} gave you a higher chance of success!`);
		}

		function callAction() {
			if(!crime.noPlayer && (!user || !menUser)) return message.reply('I\'m sorry, something went wrong.');
			client.commands.get('action').run({client, message, args: [act.help.name], p, conn, mention, user, menUser, player, menPlayer, crime, configs});
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

		function calcNear(a) {
			const min = (a > 0 && (a - 2) <= 0) ? 1 : a - 2;
			const max = a + 2;
			return chance.integer({ min, max });
		}

		function calcGain(a, b, c) {
			if((a + b) > c) return c;
			else return a + b;
		}

		function calcLoss(a, b, c) {
			if(c === 'undefined') return a - b;
			if((a - b) < c) return c;
			else return a - b;
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
		requireArgs: true,
		allowSpecial: true,
		mention: true,

		menUser: true,

		mayPlayer: true,
		mayMenPlayer: true
	},	

	get help() {
		return {
			name: 'crime',
			aliases: [''],
			category: 'Action',
			description: 'Perform an illegal action with another player.',
			usage: 'crime [action-name] @[user]',
			
			interaction: true
		};
	}
};
