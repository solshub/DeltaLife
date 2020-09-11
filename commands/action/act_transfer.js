module.exports = {
	run: async ({message, args, p, cmd, conn, player, menPlayer}) => {
		cmdTransfer = `\`${p}${cmd.help.usage}\``;
		if(isNaN(args[0]) || args[0] < 0)
			return message.reply('please include the cash value you ' +
			`want to transfer to ${firstWord(player.name)}. Usage: ${cmdTransfer}`)
		
		const value = parseInt(args[0]);

		if(player.cash < value)
			return message.reply('I\'m sorry, but you don\'t have enough money.');
		else if(player.cash == value)
			await message.channel.send(`${process.env.EMT_WARN} Please be careful! This is all your money.`);
		else if((player.cash / 2) <= value)
			await message.channel.send(`${process.env.EMT_WARN} Careful! This is more than half your money.`);
		
		let embed = {
			color: process.env.CLR_WARN,
			author: {
				name: `${firstWord(player.name)}'s tranfering money`,
				icon_url: message.author.avatarURL
			},
			description: wordsPerLine('Are you really sure you want to transfer ' +
			`$${parseFloat(value).toFixed(2)} to ${firstWord(menPlayer.name)}?`)
		}, msg;

		await message.channel.send({ embed }).then(m => msg = m);
		
		const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const result = await promise;
		if(result == 'exit') return;

		async function waitReaction(resolve, reject) {
			await msg.react(process.env.EMT_ALLOW);
			await msg.react(process.env.EMT_DENY);

			filter = (reaction, author) => { return [process.env.EMT_ALLOW, process.env.EMT_DENY]
				.includes(reaction.emoji.name) && author.id === message.author.id; };

			msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']})
			.then(async collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_ALLOW:
						return resolve();
					case process.env.EMT_DENY:		
						return exit('I see, money transfer cancelled.');
				}
			})
			.catch(() => exit('I\'m sorry, it took too long for any reaction.'));

			async function exit(a) {
				await message.reply(a).then(replyMsg => {
					msg.delete(100);
					replyMsg.delete(10000);
					message.delete(10000);
					resolve('exit');
				});
			}
		}


		const str = await updatePlayer();
		await message.channel.send(str);

		async function updatePlayer() {
			const promise = new Promise((resolve, reject) => { updatePlayer(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			await promise;

			function updatePlayer(resolve, reject) {
				player.cash -= parseFloat(value).toFixed(2);
				conn.query(`UPDATE player SET cash = ${parseFloat(player.cash).toFixed(2)} WHERE id = ${player.id}`,
				function(error, results, fields) {
					if(error) throw error;

					menPlayer.cash += parseFloat(value).toFixed(2);
					conn.query(`UPDATE player SET cash = ${parseFloat(menPlayer.cash).toFixed(2)} WHERE id = ${menPlayer.id}`,
					function(error, results, fields) {
						if(error) throw error;
						resolve();
					}).on('error', err => { sqlHandle(err); });
				}).on('error', err => { sqlHandle(err); });
			}

			const str = `${firstWord(player.name)} succesfully transfered ` +
				`$${parseFloat(value).toFixed(2)} to ${firstWord(menPlayer.name)}`;
			return str;
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
		player: true,
		menPlayer: true
	},
	
	get help() {
		return {
			name: 'transfer',
			aliases: ['give'],
			category: 'Action',
			description: 'Transfer money to another player',
			usage: 'transfer @[user] [value]'
		};
	}
};