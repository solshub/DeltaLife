module.exports = async (client, conn, guild) => {
	const promiseA = new Promise((resolve, reject) => { getServer(resolve, reject); })
	.catch(e => { console.log(e); console.log('I\'m sorry. Something went wrong.'); });
	const results = await promiseA;
	if(results.length) return;

	async function getServer(resolve, reject) {
		conn.query(`SELECT * FROM configs WHERE server = ${guild.id}`,
		function(error, results, fields) {
			if(error) throw error;
			resolve(results);
		}).on('error', (err) => { sqlHandle(err); });
	}


	const promiseB = new Promise((resolve, reject) => { insertServer(resolve, reject); })
	.catch(e => { console.log(e); console.log('I\'m sorry. Something went wrong.'); });
	await promiseB;

	async function insertServer(resolve, reject) {
		conn.query(`INSERT INTO configs(server) VALUES(${guild.id})`,
		function(error, results, fields) {
			if(error) throw error;
			resolve();
		}).on('error', (err) => { sqlHandle(err); });
	}


	const sysChan = guild.systemChannel;
	let sendTo = (sysChan && sysChan.permissionsFor(client.user).has('SEND_MESSAGES')) && sysChan;

	if(!sendTo) {
		const generalChan = guild.channels.find(c => c.name.includes('general'));
		sendTo = (generalChan && generalChan.permissionsFor(client.user).has('SEND_MESSAGES')) && generalChan; }
	
	if(!sendTo) return;

	const cmdTutorial = '`d!tutorial`',
		cmdInteractions = '`d!interactions`',
		cmdCreating = '`d!creating`';
	let embed = {
		color: process.env.CLR_HELP,
		author: {
			name: 'Meet DeltaLife! ~',
			icon_url: client.user.avatarURL },
		description: wordsPerLine('Thank you for receiving me here. I\'m DeltaLife. ' +
			`Remember to see my usage ${cmdTutorial}, I wrote it with love. ` +
			`With me, you'll have access to 30 different ${cmdInteractions} `
			`and many features on ${cmdCreating} a player and living his life!\n\n`) +
			'I wish a great time to everyone, have fun! ~'
	};

	sendTo.send({ embed });
	

	function sqlHandle(err) {
		console.log('Sorry. An error ocurred. ------------------------------');
		console.log(`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
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
};