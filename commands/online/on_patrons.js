const moment = require('moment');

module.exports = {
	run: async ({message, p, cmd, conn}) => {
		const cmdPatrons = `\`${p}${cmd.help.name}\``;
		const cmdPatreon = `\`${p}patreon\``;
		let preMsg;
		await message.channel.send(`Please use ${cmdPatreon} ` +
			'if you\'re interested in supporting me!').then(m => preMsg = m);

		promise = new Promise((resolve, reject) => { getWinners(resolve, reject); })
		.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
		const results = await promise;
		if(!results.length) return message.reply('I\'m sorry, there aren\'t enough patreon supporters.');

		function getWinners(resolve, reject) {
			const query = 'SELECT user, patreon FROM user ' +
				'WHERE patreon != \'0000-00-00 00:00:00\' ORDER BY patreon DESC';
			conn.query(query, function(error, results, fields) {
				if(error) throw error;
				resolve(results);
			}).on('error', err => { sqlHandle(err); });
		}

		let embed = {
			color: process.env.CLR_HELP,
			author: {
				name: 'List of patreon supporters!',
				icon_url: process.env.ICO_TROPHY }
		};
		
		let msg, filters, i = 0, limit = 10, result;
		do {
			await generateEmbed();
			result = await waitReaction();
		} while(result == 'repeat');

		async function generateEmbed() {
			embed.description = 'Ordered from oldest to newest.\n' +
				`There are currently ${results.length} supporters!\n` +
				'Thank you so much, each one of you.\n' +
				'Y\'all keeping me alive! ~\n'
			
			while(i < limit && i < results.length) {
				embed.description += `\n**${i + 1}.** <@!${results[i].user}>, ` +
					`since ${moment(results[i].patreon, "YYYY-MM-DD HH-MM-SS").format('LL')}`;
				i++;
			}
                                      			

			if(msg) await msg.edit({ embed });
			else await message.channel.send({ embed }).then(m => msg = m);

			if(i > 19) await msg.react(process.env.EMT_FIRST).then(filters.push(process.env.EMT_FIRST));
			if(i > 9) await msg.react(process.env.EMT_BACK).then(filters.push(process.env.EMT_BACK));
			if(i < results.length) await msg.react(process.env.EMT_NEXT).then(filters.push(process.env.EMT_NEXT));
			if((i + 11) < results.length) await msg.react(process.env.EMT_NEXT).then(filters.push(process.env.EMT_NEXT));
		}

		async function waitReaction() {
			promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
			.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
			const result = await promise;
			return result;

			async function waitReaction(resolve, reject) {
				const filter = (reaction, user) => { return filters
					.includes(reaction.emoji.name) && user.id === message.author.id; };	

				await msg.awaitReactions(filter, {max: 1, time: 60000, errors: ['time']})
				.then(async collected => {
					const reaction = collected.first();
					switch(reaction.emoji.name) {
						case process.env.EMT_FIRST:
							i = 0;
						break;
						case process.env.EMT_BACK:
							i -= 10;
						break;
						case process.env.EMT_NEXT:
							i += 10;
						break;
						case process.env.EMT_LAST:
							i = results.length;
						break;
					}
					return resolve('repeat');
				})
				.catch(async () => { 
					await preMsg.edit('*It took too long for any reaction.*\n' +
						`Use ${cmdPatrons} again if you\'re still interested.`);
					msg.clearReactions();
					resolve('exit');
				});
			}
		}


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}
	},	

	config: {},
	
	get help() {
		return {
			name: 'patrons',
			aliases: ['patreons, patron'],
			category: 'Online',
			description: 'Check the top 10 lottery winners.',
			usage: 'patrons'
		};
	}
};