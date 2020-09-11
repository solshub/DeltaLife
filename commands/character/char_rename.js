const isImage = require('is-image');

module.exports = {
	run: async ({message, args, p, cmd, conn, player}) => {
		const cmdProfile = `\`${p}profile\``;

		
		const error = checkArg();
		if(error) {
			if(typeof error == 'string') return message.reply(error);
			return message.reply('I\'m sorry, you need to include the name you want to set for ' +
				`${firstWord(player.name)}\'. Usage: \`${p}${cmd.help.usage}\``);
		}

		function checkArg() {
			if(args[0] == null) return true;
			if(message.mentions.users.size) message.mentions.users.forEach(ment => {
				if(args.indexOf(`<@!${ment.id}>`) > -1) args.splice(args.indexOf(`<@!${ment.id}>`), 1); });
			if(!args.length) return true;
			if(!args.join('').match("^[A-Za-z0-9]+$") && !cmd.config.allowSpecial)
			return 'please don\'t use any special character.';
		}

		const name = args.join(' ');


		let msg;
		await message.reply('I need to assure, do you really want to rename ' +
			`${firstWord(player.name)} to ${name}? `).then(m => msg = m);
		await msg.react(process.env.EMT_ALLOW);
		await msg.react(process.env.EMT_DENY);		

		const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
		.catch(e => { console.log(e); return 'I\'m sorry. Something went wrong'; });
		const result = await promise;
		msg.delete(100);
		if(result == 'exit') return;

		async function waitReaction(resolve, reject) {
			const filter = (reaction, user) => { return [process.env.EMT_ALLOW, process.env.EMT_DENY]
				.includes(reaction.emoji.name) && user.id === message.author.id; };
			await msg.awaitReactions(filter, {max: 1, time: 30000, errors: ['time']}).then(collected => {
				const reaction = collected.first();
				switch(reaction.emoji.name) {
					case process.env.EMT_ALLOW:
						return resolve();
					default:
						return exit('I see, renaming canceled.');
				}
			})
			.catch(() => exit('I\'m sorry, it took too long for any reaction.'));

			async function exit(a) {
				await message.reply(a).then(reply => {
					msg.delete(100);
					message.delete(4000);
					reply.delete(4000);
					resolve('exit');
				});
			}
		}


		await updateName();
		await message.channel.send(`${firstWord(player.name)} has been successfully renamed to ${name}!`);

		async function updateName() {
			const promise = new Promise((resolve, reject) => { updateName(resolve, reject); })
			.catch(e => { console.log(e); return 'I\'m sorry. Something went wrong'; });
			await promise;

			function updateName(resolve, reject) {
				conn.query(`UPDATE player SET name = ? WHERE id = ${player.id}`, [name],
				function(error, results, fields) {
					if(error) throw error;
					resolve();
				}).on('error', err => { sqlHandle(err); });
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
		player: true
	},
	
	get help() {
		return {
			name: 'rename',
			aliases: ['name'],
			category: 'Character',
			description: 'Give your character a new name.',
			usage: 'rename [new-name]'
		};
	}
};