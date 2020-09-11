const tenor = require('tenorjs').client({
	"Key": process.env.TOKEN_TENOR,
	"Locale": "en_US",
	"Filter": "low",
	"MediaFilter": "minimal"
});
const Chance = require('chance');
const chance = new Chance();

module.exports = {
	run: async ({client, message, args, p, conn, mention, user, menUser, player, menPlayer, crime, rom, configs}) => {
		const cmdCreate = `\`${p}${process.env.CMD_CREATE}\``;
		const cmdSick = `\`${p}${process.env.CMD_SICK}\``;
		const cmdPregnant = `\`${p}pregnant\``;

		if(!rom) rom = {};
		
		let isCommand;
		client.commands.array().forEach(cmd => {
			if(cmd.help.name == args[0].toLowerCase()) isCommand = cmd; });

		let act = args.join(' ').toLowerCase();	
		
		if(isCommand) {
			if(act.includes('ignoreage') || act.includes('ignore-age') || act.includes('ignore age')) {
				if(act.includes('ignoreage')) act = act.replace('ignoreage', '');
				if(act.includes('ignore-age')) act = act.replace('ignore-age', '');
				if(act.includes('ignore age')) act = act.replace('ignore age', '');
				act = act.replace(' ', '');
				rom.ignoreAge = true; }
			if(act.includes('safe')) {
				act = act.replace('safe', '');
				act = act.replace(' ', '');
				rom.safeSex = true; }
		}

		if(isCommand) act = isCommand;

		if(!crime) crime = {};


		if(configs['toggleNsfw']) if(act.help.notSfw) // jshint ignore:line
		return message.reply('I\'m sorry, this server disabled erotic or violence related actions.');

		const author = message.author;

		let build = { content: '', title: '', description: '', footer: '', stats: '' };
		if(crime.noplayer) build.content = crime.noplayer;

		let warnMsg;

		let zodiac, newRelation;
		let relation;
		let idUser, idMention;		
		let neg;
		if(typeof act === 'object') {
			if(act.crime) if(!crime.redirect && !crime.noPlayer) if(player && menPlayer)
				return act.run({client, message, args, p, conn, cmd: act, mention, user, menUser, player, menPlayer});

			if(!mention) return message.reply(`I\'m sorry, this command requires to mention another user. Usage: \`${p}${act.help.usage}\``);

			idUser = user.user;			
			if(message.author.id == menUser.user)
				return message.reply('I\'m sorry, but you can\'t use this command on yourself.');

			idMention = menUser && menUser.user;
			if(idUser == idMention)
				return message.reply('I\'m sorry, but you need to mention someone else.');
			
			if(!crime.noPlayer) {
				if(!player) await message.channel.send(`For full usage of this command, you should first ${cmdCreate} a character.`).then(m => warnMsg = m);
				else if(!menPlayer) await message.channel.send(`For full usage of this command, your mention should first ${cmdCreate} a character.`).then(m => warnMsg = m)
			}


			build.title = `${firstWord(author.username)} ${act.action.message[0]} ${firstWord(mention.username)}`;
			if(act.action.message.length > 1) build.title += ` ${act.action.message[1]}`;

			let error = await checkInteraction();	
			if(error) {
				if(error == 'timeout') return;
				else return message.reply('I\'m sorry, ' + error);
			}

			if(user && menUser) await processRelation();
			if(player && menPlayer) if(!Object.entries(crime).length)
			build.stats = await stats();

		} else {
			await insertInfo();

			if(message.mentions.users.size)
				build.content = `I have no support for any \`${act}\` action.\n`+
					'You can have a free gif, but this won\'t affect the game.';
			else build.content = `You search for \`${act}\`.`;
		}
				
		async function checkInteraction() {
			if(act.action.type == 'pos' || act.action.type == 'neg') {
				if(act.action.type == 'neg') neg = true;	
							
			} else if(act.action.type == 'rom') {
				let content;
				let res = {advice: '', impregnate: []};

				if(player && menPlayer) {
					res = getRomanticData();
					if(typeof res !== 'object') return res;
					content = res.content && res.content; }

				rom = await doCheckings(res, content);
				if(rom == 'timeout') return 'timeout';
				if(res.description) rom.description = (rom.description) ? res.description + rom.description : res.description;
				neg = !rom.allow;
			}


			function getRomanticData() {
				let advice = '', sexuality, impregnate = [], content, description = '', sick = {};
				problem = checkAge(player, menPlayer);
				if(problem) return problem;

				function checkAge(userP, menP) {
					if(rom.ignoreAge) return;
					if(!configs['ageLimit']) return;
					
					const order = [userP, menP];
					const orderR = [menP, userP];
					const functions = [
						function() { return checkKid(order); },
						function() { return checkYoungAdult(order, orderR); }
					];

					let problem;
					for(let i = 0; i < functions.length; i++) {
						problem = functions[i]();
						if(problem) return problem;
					}
					

					function checkKid(a) {
						let ageLimitation = 6;
						if(act.help.name == 'sex') ageLimitation = 14;
						for(let i = 0; i < a.length; i++) {
							if(a[i].age < ageLimitation) return `${firstWord(a[i].name)} is too young for this kind of action!\n` +
								`If you want to ignore chracter's age, use 'ignoreAge' as an argument.`;
						}
					}

					function checkYoungAdult(a, b) {
						for(let i = 0; i < a.length; i++) {
							if(b[i].age <= 17) {
								let allowed = false, j = 0, maxDifference = 5;
								if(a[i].age >= 18) maxDifference = 3;

								do {
									if((b[i].age + j) == a[i].age) allowed = true;
									j++;
								} while(!allowed && j < maxDifference);								
								if(!allowed) return `${firstWord(a[i].name)}'s too old for doing this kind of action with ${b}!\n` +
									`If you want to ignore chracter's age, use 'ignoreAge' as an argument.`;
							}							
						}
					}
				}


				advice += checkMarriage(player, menPlayer);
				
				function checkMarriage(userP, menP) {
					let playerName, userName;
					if(userP.marry) { userName = author.username; playerName = userP.name; }
					else if(menP.marry) { userName = mention.username; playerName = menP.name; }
					client.fetchUser(idMention);
					if(playerName && userName) { return `\nRemember: ${firstWord(userName)}'s player, ${firstWord(playerName)} is already married. ${process.env.EMT_WARN}`; }
					else return '';
				}


				const userGender = client.data.get('gender', player.gender);
				const menGender = client.data.get('gender', menPlayer.gender);
				if(act.help.name == 'sex' || act.help.name == 'kiss') {
					if(act.help.name == 'sex') {
						description = `**${firstWord(player.name)} ${userGender.symbol} went to bed with ${firstWord(menPlayer.name)} ${menGender.symbol} !**\n`;
						const res = checkPregnancy(userGender, menGender);						
						if(res) { advice += res.advice; impregnate = res.order; content = res.content; }
					}
					sexuality = checkGenders(userGender, menGender);
				}
				
				function checkPregnancy(userGen, menGen) {
					let preg;
					if(player.preg) preg = firstWord(player.name);
					if(menPlayer.preg) preg = firstWord(menPlayer.name);
					if(preg) { description += `> It looks like ${preg} was already ${cmdPregnant}.`; return; }
					if(rom.safeSex) { description += `> They practiced safe sex!`; return; }

					let order = [];
					if(userGen.details.getpreg && menGen.details.impreg) order = [{ id: menPlayer.id, name: menPlayer.name, symbol: menGen.symbol }, { id: player.id, name: player.name, symbol: userGen.symbol }];
					else if(userGen.details.impreg && menGen.details.getpreg) order = [{ id: player.id, name: player.name, symbol: userGen.symbol }, { id: menPlayer.id, name: menPlayer.name, symbol: menGen.symbol }];						
					if(order.length) {
						const cmdSafe = `\`${p}${act.help.name} @[user] safe\``;
						let advice, content;
						advice = `\n> ${process.env.EMT_WARN} By doing this ${firstWord(order[0].name)} may get ${firstWord(order[1].name)} pregnant.`;
						content = `Use ${cmdSafe} to avoid pregnancy and diseases.`;
						return { order, advice, content };
					}
				}

				function checkGenders(userGen, menGen) {
					if(userGen && menGen) {
						let sum = userGen.details.male + menGen.details.male;
						if(sum === 2) return 'gay';
						else if(sum === 0) return 'lesbian';
						else if(sum !== 1) console.log('Something went weird with genders.');
						return 'straight';
					}
				}


				switch(act.help.name) {
					case 'cuddle':
					case 'date':
					case 'kiss':
					case 'sex':
					case 'hold hands':
						const res = checkSafe();
						if(res) { advice += res.advice && res.advice;
							sick = res.sick && { name: res.sick.sick, getting: res.who[1] }; }
						break;
				}

				const genders = (userGender && menGender) ? { user: userGender, men: menGender } : undefined;
				return { advice, sexuality, impregnate, content, description, sick, genders };		

				function checkSafe() {
					if(rom.safeSex) return;
					
					let userSick, menSick;
					userSick = player.sick && client.data.get('sick', player.sick.sick);
					menSick = menPlayer.sick && client.data.get('sick', menPlayer.sick.sick);
										
					const diseases = client.data.get('sick', null), sexSick = {};
					const sexDiseases = Object.values(diseases).filter(d => d.risk && d.risk.sex);
					if(userSick) sickUser = sexDiseases.find(d => d.sick == userSick.sick);
					if(menSick) sickMen = sexDiseases.find(d => d.sick == menSick.sick);

					if(userSick && !menSick) { sexSick.sick = sickUser; sexSick.who = [player.name, menPlayer.name]; }
					else if(menSick && !userSick) { sexSick.sick = sickMen; sexSick.who = [menPlayer.name, player.name]; }
					else if(userSick && menSick) if(sickUser || sickMen) return { advice: `\n> Both of them are already sick, so there's no risk!` };

					if(!sexSick.sick) return;
					if(Object.entries(sexSick).length) {
						sexSick.advice = `\n> ${process.env.EMT_WARN} Careful, ${firstWord(sexSick.who[1])} may get ${sexSick.sick.sick} from ${firstWord(sexSick.who[0])}`;
						return sexSick;
					}
				}
			}

			async function doCheckings(res, content) {
				let problem = checkPreference();
				if(problem) {
					build.content = problem;
					return { allow: false };
				}

				function checkPreference() {
					const pref = menUser.sexual && client.data.get('sexual', menUser.sexual);

					let sexual, warn = '';
					if(pref) sexual = pref.sexuality.charAt(0).toLowerCase() + pref.sexuality.slice(1);
					else return;

					warn = checkRegistered();
					if(!warn) warn = checkPreference();

					if(warn) return `Auto-denied! ${firstWord(author.username)} is ${sexual}!\n` + warn;

					function checkRegistered() {
						if(pref.reqPlayer) {
							if(!player) {
								if(sexual == 'Ambisexual') return `If you want this to work, you should ${cmdCreate} a character.`;
								else return `First, ${cmdCreate} a character if you want to have any chance.`;
							}							
						}
					}

					async function checkPreference() {
						switch(sexual) {
							case 'Malesexual':
								if(res.genders.user) if(!res.genders.user.details.male)
								return `Sadly, ${firstWord(player.name)} isn't man enough...`;
							break;
							case 'Femalesexual':
								if(res.genders.user) if(res.genders.user.details.male)
								return `And... ${firstWord(player.name)} is definitely not a female.`;
							break;
							case 'Heterosexual':
								if(res.genders.men.details.male) {
									if(res.genders.user.details.male)
									return `${firstWord(player.name)} definitely isn't his type.`;
								} else {
									if(!res.genders.user.details.male)
									return `${firstWord(player.name)} just isn't man enough for her!`;
								}
							break;
							case 'Homosexual':
								if(res.genders.men.details.male) {
									if(!res.genders.user.details.male)
									return `${firstWord(player.name)} just isn't man enough for him!`;
								} else {
									if(res.genders.user.details.male)
									return `${firstWord(player.name)} definitely isn't her type.`;
								}
							break;
							case 'Asexual':
								return 'You should try doing romance with someone else.';
							case 'Demisexual':		
								await relationData();
								if(relation.friend < 75)
								return 'You two should try getting closer before trying any of that.';
							break;
							case 'Greysexual':
								if(!zodiacRelation()) return `There's just no chemistry between you two...`;
							break;
						}

						async function relationData() {
							const promiseA = new Promise((resolve, reject) => { getRelationData(resolve, reject); })
							.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
							relation = await promiseA;
						}

						function zodiacRelation() {
							const menZodiac = client.data.get('zodiac', menUser.zodiac);
							if(menZodiac.partners.includes(user.zodiac)) return true;
							else return false;
						}
					}
				}


				if(content) await message.channel.send(content).then(msg => content = msg);

				const sexuality = (res.sexuality) ? res.sexuality : undefined;

				
				promise = new Promise((resolve, reject) => { reactAllow(res.advice, resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				const allow = await promise;
				if(allow == 'timeout') return 'timeout';
				if(allow === false) return { allow };
			
				function reactAllow(advice, resolve, reject) {
					if(mention.id == client.user.id) return resolve(true);
					
					let desc = `${firstWord(mention.username)}, ${firstWord(author.username)} is trying to ${act.action.request} you.\n`+
						`React with \`${process.env.EMT_ALLOW}\` to allow or \`${process.env.EMT_DENY}\` to deny.`;
					if(advice) desc += advice;
		
					const inputReact =  { description: desc, color: process.env.CLR_WARN };
					message.channel.send({embed: inputReact}).then((reactMsg) => {
						reactMsg.react(process.env.EMT_ALLOW).then(() => reactMsg.react(process.env.EMT_DENY));

						const filter = (reaction, author) => {
							return [process.env.EMT_ALLOW, process.env.EMT_DENY]
							.includes(reaction.emoji.name) && author.id === mention.id; };
						reactMsg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
						.then(collected => {
							const reaction = collected.first();
							if(content) content.delete(100);
							reactMsg.delete(100);
							if(reaction.emoji.name === process.env.EMT_ALLOW) resolve(true);
							else resolve(false);
						})
						.catch(() => {										
							message.reply('I\'m sorry, it took too long for any reaction.').then(replyMsg => {								
								if(content) content.delete(100);
								if(warnMsg) warnMsg.delete(100);
								reactMsg.delete(100);
								replyMsg.delete(10000);
								message.delete(10000);
								resolve('timeout');
							});
						});
					});
				}


				let description = '';
				if(allow && res.impregnate) if(res.impregnate.length) await testPregnancy(res.impregnate);				
				if(allow && res.sick) if(Object.entries(res.sick).length > 0) await testSickness(res.sick);

				return { allow, description, sexuality };
				
				async function testPregnancy(order) {
					let query = {}, desc = {};
					query.query = 'UPDATE player SET preg = ? WHERE id = ?';
					query.target = [order[0].id, order[1].id];
					desc.sucess = `> ${firstWord(res.impregnate[1].name)}'s feeling like maybe she's ${cmdPregnant}!`;
					desc.fail = `> It doesn\'t look like ${firstWord(res.impregnate[1].name)} got pregnant.`;

					promise = new Promise((resolve, reject) => { chanceOf(resolve, reject, 50, query, desc); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					await promise;
				}

				async function testSickness(sick) {
					let query = {}, desc = {};
					query.query = 'UPDATE player SET sick = ? WHERE id = ?';

					const diseases = client.data.get('sick', null);
					const index = Object.values(diseases).findIndex(d => d.sick == sick.name);
					query.target = [index, sick.getting];

					desc.sucess = `> Later, after noticing some weird things,`+
						` ${firstWord(sick.getting)} was diagnosed with ${sick.name}! 😢 Use ${cmdSick} to check on that.`;
					desc.fail = `> ${sick.getting}'s feeling really lucky!`;					

					promise = new Promise((resolve, reject) => { chanceOf(resolve, reject, 70, query, desc); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					await promise;		
				}

				function chanceOf(resolve, reject, rate, query = {}, desc = {}) {
					if(rate <= chance.integer({ min: 0, max: 100 })) {
						conn.query(query.query, query.target, function(error, results, fields) {
							if(error) throw error;
							description += desc.sucess;
							resolve(true);
						}).on('error', err => { sqlHandle(err); });
					} else {
						description += desc.fail;
						resolve(false);
					}
				}
			}
		}

		async function stats() {
			let limits = { max: 100, min: 0 }, valUser, valMen, altVal;

			add = {};
			if(Object.entries(rom).length) {
				if(user.zodiac == 11) { zodiac = true; altVal = calcNear(20); }
				if(user.zodiac == 10 && newRelation) { zodiac = true; altVal = calcNear(20); }
				valUser = calcNear(15);
				add = { user: rom.allow, men: (rom.allow) ? rom.allow : undefined }; }
			else {
				if(neg) {
					if(user.zodiac == 0) { zodiac = true; altVal = calcNear(15); }
					if(user.zodiac == 10 && newRelation) { zodiac = true; altVal = calcNear(15); }
					if(menUser) if(menUser.zodiac == 6) { zodiac = 'men'; altVal = 0; } }
				valUser = calcNear(10);
				add = { user: true, men: !neg }; }				

			let stats = {};
			stats.user = calcChange(add.user, player.happy, player.social, (altVal) ? altVal : valUser, [limits]);
			if(altVal) valUser = altVal;

			if(add.men !== 'undefined') {
				valMen = Math.round(valUser * 0.75);
				stats.men = calcChange(add.men, menPlayer.happy, menPlayer.social, valMen, [limits]); } 
			
			let desc;
			updateDesc(firstWord(player.name), valUser);
			const promiseA = new Promise((resolve, reject) => { updateStats(resolve, reject, player.id, stats.user); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseA;
			if(stats.men) {
				updateDesc(firstWord(menPlayer.name), (add.men) ? valMen : (valMen * -1));
				const promiseB = new Promise((resolve, reject) => { updateStats(resolve, reject, menPlayer.id, stats.men); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promiseB;
			}
			return desc;			

			function updateDesc(name, a) {
				desc = (desc) ? desc + '\n> ' : '> ';
				desc += `${name} got ${((a > 0) ? ' +' : '') + a} happy & `;
				desc += `${((a > 0) ? ' +' : '') + a} social`;
			}

			function updateStats(resolve, reject, id, a = []) {
				query = `UPDATE player SET happy = ${a[0]}, social = ${a[1]} WHERE id = ${id}`;
				conn.query(query, function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}

		async function processRelation() {
			if(!relation) {
				const promiseA = new Promise((resolve, reject) => { getRelationData(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				relation = await promiseA;
			}

			const val = calcNear(act.action.value);
			const result = calcFriendLove(relation);
			const query = describeQuery(result.friend, result.love, relation);

			function calcFriendLove(rel) {
				let friend, love;

				const add = (!neg || rom.allow === true);
				const limits = [{ max: 100, min: -100 }, { max: 100, min: 0 }];
				const both = (Object.entries(rom).length > 0);
				const values = calcChange(add, rel.friend, rel.love, val, limits, both);
				friend = values[0];
				if(values[1]) love = values[1];

				if(love) return {friend, love};
				return {friend};
			}

			function describeQuery(friend, love, rel) {
				// Get titles and order them by value
				let titles = client.data.get('title', null);
				titles = Object.values(titles).sort((a,b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0));
				f = titles.filter(el => el.class == 'friend');
				l = titles.filter(el => el.class == 'love');
				let newTitle;

				let titleFriend = (friend >= 0) ? f.reverse().find(el => friend >= el.value) : f.find(el => friend <= el.value);
				let titleLove = l.reverse().find(el => love >= el.value);
				newTitle = (titleLove) ? titleLove : titleFriend;

				let query = `friend = ${friend}`;
				if(love || love === 0) query += `, love = ${love}`;

				if(rel.title !== newTitle.id) {
					const oldTitle = client.data.get('title', rel.title);
					if(build.description) build.description += '\n';

					if(oldTitle.class == 'love') build.description += `They are already ${oldTitle.relate}!`;
					else {
						build.description += `They are now ${newTitle.relate}!`;
						query += `, title = ${newTitle.id}`;
					}				
				}

				if(rel.friend !== friend) {
					build.footer = `${symbol(true)} friend points`;
					build.footer += `${symbol()} ${friend}/100 `;
				} else build.footer = `${maxMin()} friendship`;				
				if(love || love === 0) {
					build.footer += ` & `;
					if(rel.love !== love) {
						build.footer += `${symbol(true)} love points`;
						build.footer += `${symbol()} ${love}/100`;
					} else build.footer = `${maxMin()} love`;
				}
				
				return query;
			}


			const promiseB = new Promise((resolve, reject) => { updateRelation(resolve, reject, query, relation, result.love); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promiseB;			

			function updateRelation(resolve, reject, query, rel, love) {
				conn.query('UPDATE relation SET ' + query + ` WHERE id = ${rel.id}`, function(error, results, fields) {
					if(error) throw error;
					
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}


			function maxMin() {
				return (neg || rom.allow === false) ? 'Minimum' : 'Maximum';
			}

			function symbol(equation) {
				if(equation) return ((neg || rom.allow === false) ? '-' : ' +') + val;
				return (neg || rom.allow === false) ? '...' : '!';
			}
		}

		async function insertInfo() {
			if(act.length > 10) return;

			const promise = new Promise((resolve, reject) => { insertInfo(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function insertInfo(resolve, reject) {
				conn.query(`INSERT INTO info(action) VALUES('${act}')`,
				function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
			}
		}

		
		await buildEmbed();
		
		async function buildEmbed() {
			let embed = { author: { icon_url: message.author.avatarURL }, footer: {} };

			const result = await getGif();
			if(result.icon) embed.thumbnail = { url: result.icon };
			if(result.gif) embed.image = { url: result.gif };
			else return message.reply(`I wasn\'t able to find any gif related to \`${act}\`.`);

			async function getGif() {
				let obj = {};
				if(act.action) if(act.action.icon && rom.allow !== false && crime.able !== false && !crime.noPlayer) obj.icon = act.action.icon;
	
				let getFrom = (rom.allow === false || crime.able === false) ? 'deny' : ((typeof act === 'object') ? act.help.name : act);
				if(!getFrom) getFrom = act;
	
				let gesture= [];
				if(client.gifs.has(getFrom)) gesture = client.gifs.get(getFrom);
				if(getFrom == 'sex') {
					const sexuality = (rom.sexuality) ? rom.sexuality : 'straight';
					gesture = client.gifs.get(getFrom, sexuality); }
				if(gesture.length) {
					obj.gif = chance.pickone(gesture);
					return obj;
				}	
				
				const promise = new Promise((resolve, reject) => { searchGif(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				const gif = await promise;
				obj.gif = gif;
				return obj;
	
				function searchGif(resolve, reject) {
					build.footer = 'Via Tenor';
					build.footerIcon = process.env.ICO_TENOR;

					tenor.Categories.Find(act, 3).then(results => {
						if(!results.length) return resolve();
						const gif = chance.pickone(results);
	
						let url;
						if(gif.media[0]) {
							if(gif.media[0].mediumgif) url = gif.media[0].mediumgif.url;
							else if(gif.media[0].gif) url = gif.media[0].gif.url;
						} else url = gif.url;
						resolve(url);
					}).catch(console.error);
				}
			}


			if(user && menUser) {
				if(build.stats && !embed.thumbnail) embed.thumbnail = { url: process.env.ICO_FRIEND };
				build.color = process.env.CLR_ACT_POS;
				build.footerIcon = process.env.ICO_FRIEND;
				if(neg || rom.allow === false) {
					if(build.stats && !embed.thumbnail) embed.thumbnail.url = process.env.ICO_MEAN;
					build.color = process.env.CLR_ACT_NEG;
					build.footerIcon = process.env.ICO_MEAN; }				
				if(rom.allow === true) {
					if(build.stats && !embed.thumbnail) embed.thumbnail.url = process.env.ICO_HEART;
					build.color = process.env.CLR_ACT_ROM;
					build.footerIcon = process.env.ICO_HEART; }

				if(rom.allow === false || crime.able === false) {
					const actName = (act.action.request) ? act.action.request : act.help.name;
					build.title = `${firstWord(author.username)} failed to ${actName} ${firstWord(mention.username)}\n`; }
			}

			if(build.color) embed.color = build.color;
			if(build.footerIcon) embed.footer.icon_url = build.footerIcon;
			if(build.footer) embed.footer.text = build.footer;						
			if(build.title) embed.author.name = build.title;

			if(build.description) embed.description = build.description;			
			includeInDescription(crime.description);
			includeInDescription(rom.description);
			if(build.stats) includeInDescription(build.stats);

			function includeInDescription(a) {
				if(!a) return;
				if(embed.description) {
					if(!embed.description.endsWith('\n')) embed.description += '\n';
				} else embed.description = '';
				embed.description += a;
			}


			if(build.content) {
				await message.channel.send(build.content)
				.then(async () => { await message.channel.send({ embed }); });
			} else await message.channel.send({ embed });


			if(typeof act == 'object') if(act.help.name == 'sex') {
				if(player) await client.commands.get('addict').run({ client, message, conn, user, addict: { set: 'sex' } });
				await client.commands.get('achievs').run({ client, message, conn, user, achiev: 'sex' });
			}
		}


		if(crime.killed) {
			await client.commands.get('death')
			.run({client, message, args, p, conn, user: menUser, player: menPlayer, cause: 'by being killed'});
			return; }

		if(zodiac) {
			let zodiac, who;
			if(zodiac == 'men') { zodiac = client.data.get('zodiac', menUser.zodiac);
				who = `mention's zodiac ${zodiac.symbol}`; }
			else { zodiac = client.data.get('zodiac', user.zodiac);
				who = `zodiac ${zodiac.symbol}`; }
			await message.channel.send(`It looks like your ${who} had influence in the happy & social!`);
		}

		
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
				newRelation = true;
				return tmpId;

				function insert(resolve, reject) {
					conn.query('INSERT INTO relation(userA, userB) VALUES (?, ?)', order, function(error, results, fields) {
						if(error) throw error;
						resolve(results.insertId);
					}).on('error', err => { sqlHandle(err); });
				}
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

		function calcNear(a) {
			const min = (a > 0 && (a - 2) <= 0) ? 1 : a - 2;
			const max = a + 2;
			return chance.integer({ min, max });
		}
		
		function calcChange(add, a, b, val, limits = [], both = true) {
			let c, d;
			if(limits.length == 1) limits[1] = limits[0];

			if(add) {
				if(both) {
					c = calcMaxMin(a + val, limits[0]);
					d = calcMaxMin(b + val, limits[1]);
				} else c = calcMaxMin(a + val, limits[0]);
			} else {
				if(both) {
					c = calcMaxMin(a - val, limits[0]);
					d = calcMaxMin(b - val, limits[1]);
				} else c = calcMaxMin(a - val, limits[0]);
			}
			return [c, d];

			function calcMaxMin(a, b = {}) {
				if(a > b.max) return b.max;
				if(a < b.min) return b.min;
				return a;
			}
		}
	},	

	config: {
		onlyGuilds: true,
		requireArgs: true,
		allowSpecial: true,
		
		mayMention: true,
		mentionSelf: true,

		mayMenUser: true,

		mayPlayer: true,
		mayMenPlayer: true		
	},
	
	get help() {
		return {
			name: 'act',
			aliases: ['a', 'action'],
			category: 'Action',
			description: 'Perform an action with another user, or search for a gif.',
			usage: 'act [action-name] @[user]\` OR \`act [term-to-search]',
			
			interaction: true
		};
	}
};