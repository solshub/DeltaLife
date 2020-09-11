module.exports = {
	run: async ({client, message, args, conn}) => {
		if(args[0].length > 3) return message.reply('the prefix you\'re trying to set is too long.');


		const promiseA = new Promise((resolve, reject) => { checkPrefix(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const p = await promiseA;
		if(args[0] == p) return message.reply(`the prefix for this server is already ${p}.`);

		function checkPrefix(resolve, reject) {
			if(!message.guild) resolve(process.env.PREFIX);
			else {
				conn.query(`SELECT prefix FROM configs WHERE server = ${guild.id}`, function(error, results, fields) {
					if(error) throw error;
					if(!results.length) resolve(process.env.PREFIX);
					else resolve(results[0].prefix);
				}).on('error', (err) => { sqlHandle(err); });
			}
		}
		
		
		const promiseB = new Promise((resolve, reject) => { setPrefix(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		await promiseB
		.then(() => message.channel.send(`Alright, the new prefix for this server is \`${args[0]}\`.`));		


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}

		function setPrefix(resolve, reject) {
			conn.query(`UPDATE configs SET prefix = ? WHERE server = ${guild.id}`, [args[0]], function(error, results, fields) {
				if(error) throw error;
				resolve();
			}).on('error', (err) => { sqlHandle(err); });
		}
	},

	config: {
		onlyAdmins: true,
		onlyGuilds: true,
		requireArgs: true,
		allowSpecial: true
	},
	
	get help() {
		return {
			name: 'prefix',
			aliases: ['p'],
			category: 'Settings',
			description: 'Change the current prefix.',
			usage: 'prefix [new-prefix]'
		};
	}
};