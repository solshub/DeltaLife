const Chance = require('chance');
const chance = new Chance();

module.exports = async (client, conn, message) => {
	if(message.author.bot) return;


	const promise = new Promise((resolve, reject) => { checkPrefix(resolve, reject); })
	.catch(e => { console.log(e); return console.log('SOMETHING WENT WRONG WITH PREFIX CHECKING.'); });
	const p = await promise;

	function checkPrefix(resolve, reject) {
		if(!message.guild) resolve(process.env.PREFIX);
		else {
			conn.query(`SELECT prefix FROM configs WHERE server = ${message.guild.id}`, function(error, results, fields) {
				if(error) throw error;
				if(!results.length) resolve(process.env.PREFIX);
				else resolve(results[0].prefix);
			}).on('error', (err) => { sqlHandle(err); });
		}
	}


	let permsEmbed;
	if(message.guild) permsEmbed = checkPermissions();
	if(permsEmbed) return permsEmbed !== 'nosend' &&
		message.channel.send(permsEmbed);

	function checkPermissions() {
		let embed = {			
			color: process.env.CLR_ACT_NEG,
			author: {
				name: `Permissions required`,
				icon_url: client.user.avatarURL },
			description: '',
			footer: { text: 'I promise I will only be ' +
				'tweaking with my own messages and command messages.' } }

		const permissions = message.channel.permissionsFor(client.user);
		if(!permissions.has('SEND_MESSAGES')) return 'nosend';

		['ADD_REACTIONS', 'MANAGE_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS'].forEach(p => {
			if(!permissions.has(p)) embed.description += `${embed.description ? '\n' : ''} ${p} `; });
		
		if(embed.description) {
			let permsStr = embed.description;
			embed.description = 'I\'m sorry. I can\'t ' +
				'perform any command if don\'t have all permissions I may be using. ';
			if(!permissions.has('EMBED_LINKS'))
				embed.description += `*${embed.footer.text}* `;
			embed.description += `Missing required permissions:`;
			if(permissions.has('EMBED_LINKS')) {
				embed.description = wordsPerLine(embed.description);
				embed.footer.text = wordsPerLine(embed.footer.text); }
			embed.description += `\n\`${permsStr}\``;
		}

		return embed.description && ((permissions.has('EMBED_LINKS') && { embed }) || embed.description);


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
	}


	const cmdCreate = `\`${p}create\``;

	if(message.content.indexOf(p) !== 0) return console.log(`${message.author.username}#${message.author.discriminator} said: ${message.content}`);
	
	const args = message.content.slice(p.length).trim().split(/ +/g);
	const mens = args.filter(a => a.includes('<@') && a.includes('>'));
	if(mens.length) mens.forEach(m => args.splice(args.findIndex(a => a == m), 1));
	
	const command = args.shift().toLowerCase();
	const cmd = client.commands.get(command);
	if(!cmd) return;	


	let user, menUser;
	let player, menPlayer;
	let mention, mentions;
	let configs;

	if(message.guild) configs = await getSettings(message.guild.id);
	let error = await checkConfigs();
	if(error) return message.reply('I\'m sorry, ' + error);

	async function getSettings(guild) {
		const promise = new Promise((resolve, reject) => { checkSettings(resolve, reject); })
		.catch(e => { console.log(e); console.log('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		return result;

		async function checkSettings(resolve, reject) { // jshint ignore:line
			conn.query(`SELECT * FROM configs WHERE server = ${guild}`, function(error, results, fields) {
				if(error) throw error;
				resolve(results[0]);
			}).on('error', (err) => { sqlHandle(err); });
		}
	}

	async function checkConfigs() {
		if(configs) {
			if(!configs['toggleAll']) { // jshint ignore:line
				if(cmd.help.category !== 'Settings' && cmd.help.category !== 'Online' && cmd.help.category !== 'Utils' && cmd.help.category !== 'Support')
				if(cmd.help.name !== 'relation')
				if(!cmd.help.interaction) return 'this server disabled commands that aren\'t interactions.';
			}
			if(configs['toggleNsfw']) { // jshint ignore:line
				if(cmd.help.notSfw) return 'this server disabled erotic or violence related actions.';
			}
		}

		if((cmd.config.onlyGuilds || cmd.config.onlyAdmins) && !message.guild) return 'this command is meant for servers.';
		if(cmd.config.onlyAdmins && !message.member.hasPermission('ADMINISTRATOR')) return 'you require administrator permission for using this command.';

		if(cmd.config.requireArgs) if(args[0] == null)
			return `this command requires an argument. Usage: \`${p}${cmd.help.usage}\``;
		
		if(message.mentions.users)
		if(message.mentions.users.size) message.mentions.users.forEach(ment => {
			if(args.indexOf(`<@!${ment.id}>`) > -1) args.splice(args.indexOf(`<@!${ment.id}>`), 1); });

		if(cmd.config.requireArgs) {
			if(!args.length)
				return `this command requires an argument other than a player. Usage: \`${p}${cmd.help.usage}\``;		
			if(!args.join('').match("^[A-Za-z0-9]+$") && !cmd.config.allowSpecial)
				return `please don't use any special character.`; }

		
		let error;
		if(cmd.config.mentions || cmd.config.mention || cmd.config.menUser || cmd.config.menPlayer) error = checkMentions(false);
		else if(cmd.config.mayMention || cmd.config.mayMenUser || cmd.config.mayMenPlayer) error = checkMentions(true);		
		if(error) return error;
		else error = undefined;

		function checkMentions(may, single, self) {
			if(!message.mentions.users.size) 
				return (may) ? null : `this command requires to mention another user. Usage: \`${p}${cmd.help.usage}\``;
				

			if(cmd.config.mention || cmd.config.mayMention) single = true;
			else if(cmd.config.menUser || cmd.config.mayMenUser || cmd.config.menPlayer || cmd.config.mayMenPlayer) single = true;
			if(cmd.config.mentionSelf) self = true;
			if(message.mentions.users.size > 1 && (cmd.config.mention || cmd.config.mayMention)) return `you can only mention a single user at a time. Usage: \`${p}${cmd.help.usage}\``;
			if(!single && message.mentions.users.size == 1) return 'you need to mention someone else.';		
			for(const m of message.mentions.users.array()) {
				if(m.id == message.author.id && !self) return 'you can\'t use this command on yourself.';
			}

			if(single) mention= message.mentions.users.first();
			else {
				mentions = [];
				for(const m of message.mentions.users.array()) { mentions.push(m); }
			}
		}


		functions = [function(resolve, reject) { getUserPlayer({resolve, reject, idFrom: 'author', get: 'user'}); }];

		if(cmd.config.player || cmd.config.mayPlayer) functions.push(
			function(resolve, reject) { getUserPlayer({resolve, reject, idFrom: 'author', get: 'player'}); });
				
		if(cmd.config.menUser) functions.push(
			function(resolve, reject) { getUserPlayer({resolve, reject, idFrom: 'mention', get: 'user'}); });
		if(cmd.config.menPlayer) functions.push(
			function(resolve, reject) { getUserPlayer({resolve, reject, idFrom: 'mention', get: 'player'}); });
		if(mention) {
			if(cmd.config.mayMenUser) functions.push(
				function(resolve, reject) { getUserPlayer({resolve, reject, idFrom: 'mention', get: 'user'}); });
			if(cmd.config.mayMenPlayer) functions.push(
				function(resolve, reject) { getUserPlayer({resolve, reject, idFrom: 'mention', get: 'player'}); });
		}
		
		const promise = new Promise((resolve, reject) => { waitGetters(resolve, reject); })
		.catch(e => { console.log(e); return 'I\'m sorry. Something went wrong'; });
		error = await promise;
		if(error) return error;		

		
		async function waitGetters(resolve, reject) {
			if(functions.length) {
				for(const func of functions) {
					const promise = new Promise((res, rej) => { func(res, rej); })
					.catch(e => { console.log(e); return 'I\'m sorry. Something went wrong'; }); // jshint ignore:line
					const error = await promise;
					if(error) return resolve(error);
				}
				resolve();
			} else resolve();
		}

		function getUserPlayer({resolve, reject, idFrom, get}) {
			let id;
			if(idFrom == 'author') id = message.author.id;
			else if(idFrom == 'mention') if(mention) id = mention.id;
			getUserPlayer();
			
			function getUserPlayer() {
				if(!id) return resolve();
				let query;
				if(get == 'user') query = `SELECT * FROM user WHERE user = ${id}`;
				else if(get == 'player') query = `SELECT player.* FROM player INNER JOIN user `+
											`ON player.user = user.id AND user.user = ${id} `+
											`WHERE player.alive = true AND player.active = true`;
				conn.query(query, (error, results, fields) => {
					if(error) throw error;
					if(results.length > 1) console.log(`User ${results[0].user} seems to have multiple ${get} entries.`);

					if(!results.length) {
						if(get == 'user') insertUser();
						if(get == 'player') {
							if(idFrom == 'author' && cmd.config.player) return resolve(`you should first ${cmdCreate} a character.`);
							if(idFrom == 'mention' && cmd.config.menPlayer) return resolve(`your mention should first ${cmdCreate} a character.`);
							resolve();
						}
					} else {
						if(idFrom == 'author') {
							if(get == 'user') user = results[0];
							else if(get == 'player') player = results[0];
						} else if(mention) if(idFrom == 'mention') {
							if(get == 'user') menUser = results[0];
							else if(get == 'player') menPlayer = results[0];
						}
		
						resolve();
					}

				}).on('error', (err) => { sqlHandle(err); });
			}
			
			async function insertUser() {
				const promise = new Promise((res, rej) => { insertUser(res, rej); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promise;
				getUserPlayer();

				function insertUser(resolve, reject) {
					const zodiac = chance.integer({ min: 0, max: 11 });
					conn.query(`INSERT INTO user(user, zodiac) VALUES(${id}, ${zodiac})`, function(error, results, fields) {
						if(error) throw error;
						resolve();
					}).on('error', (err) => { sqlHandle(err); });
				}
			}
		}
	}	

	
	user = await getUserData(user);

	error = await client.commands.get('timeout')
	.run({client, message, args, p, conn, user, time: { set: 'general' }});
	if(error) return message.reply('I\'m sorry, ' + error);	

	if(menUser) menUser = await getUserData(menUser);

	async function getUserData(u) {
		u.achievs = await getData('achievs');
		u.timeout = await getData('timeout');

		async function getData(a) {
			const promise = new Promise((resolve, reject) => { getData(a, resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			let results = await promise;
			return results[0];
			
			function getData(a, resolve, reject) {
				let query = `SELECT * FROM ${a} WHERE user = ${u.id}`;

				conn.query(query, async function(error, results, fields) {
					if(error) throw error;
					if(!results.length) {
						await insertData();
						getData(a, resolve, reject);
					} else resolve(results);
				}).on('error', err => { sqlHandle(err); });
			}
			
			async function insertData() {
				const promise = new Promise((res, rej) => { insertData(a, res, rej); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promise;
				
				function insertData(a, resolve, reject) {
					conn.query(`INSERT INTO ${a}(user) VALUES(${u.id})`,
					function(error, results, fields) {
						if(error) throw error;
						resolve();
					}).on('error', err => { sqlHandle(err); });
				}
			}
		}


		return u;
	}

	if(player) player = await getPlayerData(player);
	if(menPlayer) menPlayer = await getPlayerData(menPlayer);

	async function getPlayerData(p) {
		if(p.preg) p.preg = await getData('player', p.preg);

		p.gamble = await getData('gamble');
		p.yearly = await getData('yearly');
		p.addict = await getData('addict');
		p.sick = await getData('sick');

		p.job = await getData('job');
		p.degree = await getData('degree');

		p.cars = await getData('car');
		p.houses = await getData('house');

		p.children = { female: [], male: [], other: []  };
		p.children = await getData('children');

		async function getData(a, b) {
			const promise = new Promise((resolve, reject) => { getData(a, resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			let results = await promise;
			
			function getData(a, resolve, reject) {
				let query = `SELECT * FROM ${a} WHERE `;
				if(a == 'children') query += `parentA = ${p.id} OR parentB = ${p.id}`;
				else if(a == 'player') query += `id = ${b}`;
				else query += `player = ${p.id}`;					

				conn.query(query, async function(error, results, fields) {
					if(error) throw error;
					if(!results.length) {
						switch(a) {
							case 'gamble':
							case 'yearly':
							case 'addict':
							case 'job':
							case 'degree':
								await insertData();
								return getData(a, resolve, reject);
							default:
								return resolve([]);
						}
					} else resolve(results);
				}).on('error', err => { sqlHandle(err); });
			}
			
			async function insertData() {
				const promise = new Promise((res, rej) => { insertData(a, res, rej); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promise;
				
				function insertData(a, resolve, reject) {
					conn.query(`INSERT INTO ${a}(player) VALUES(${p.id})`,
					function(error, results, fields) {
						if(error) throw error;
						resolve();
					}).on('error', err => { sqlHandle(err); });
				}
			}

		
			switch(a) {
				case 'gamble':
				case 'yearly':
				case 'addict':
				case 'job':
				case 'degree':
					return results[0];
			}
			
			let others = [], male = [], female = [];
			let carsHousesSicks = [];

			results.forEach(res => {
				if(a == 'children') {
					if(res.children === 0) other.push(res);
					if(res.children === 1) male.push(res);
					if(res.children === 2) female.push(res);										
				} else carsHousesSicks.push(res);
			});

			if(carsHousesSicks.length) return carsHousesSicks;
			else return { others, male, female };
		}


		return p;
	}

	
	switch(cmd.help.name) {
		case 'age':
		case 'random':
		case 'drink':
		case 'drugs':
		case 'study':
		case 'work':
			error = await client.commands.get('timeout')
			.run({client, message, args, p, conn, user, time: { set: cmd.help.name }});
			if(error) return message.reply('I\'m sorry, ' + error);
	}


	console.log(`${message.author.username}#${message.author.discriminator} executed ${cmd.help.name}.`);
	let props = {client, conn, message, args, cmd, p, configs};

	if(mention) props.mention = mention;
	if(mentions) props.mentions = mentions;

	if(user) props.user = user;
	if(player) props.player = player;
	if(menUser) props.menUser = menUser;
	if(menPlayer) props.menPlayer = menPlayer;

	cmd.run(props);

	
	function sqlHandle(err) {
		console.log('Sorry. An error ocurred. ------------------------------');
		console.log(`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
	}
};

/*
configs			//return configs data

onlyGuilds		// only used on servers
onlyAdmins		// only administrator role

requireArgs		// require argument thats not mention
allowSpecial	// allow special characters

mentions		// require multiple mentions
mention			// require mention
mentionSelf		// able to mention self
mentionsSelf	// able to mention self if someone else is mentioned
mayMention 		// may include mention

player 			// require user to have active player
mayPlayer 		// may user have active player
user 			// require user to be registered
menPlayer 		// require to mention active player
mayMenPlayer 	// may mention have active player
menUser 		// require mention to be registered
mayMenUser		// may mention be registered
*/