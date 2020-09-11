const isImage = require('is-image');

module.exports = {
	run: async ({message, args, p, cmd, conn, player}) => {
		const cmdProfile = `\`${p}profile\``;


		let img;
		if(message.attachments.size > 0) {
			img = message.attachments.find(i => isImage(i.url));
			img = img.url;
		}

		if(!img) {
			const error = checkArg();			
			if(error) return noImage();
			else img = args.find(isImage);
		}

		if(!img) { await noImage(); return; }

		function checkArg() {
			if(args[0] == null) return true;
			if(message.mentions.users.size) message.mentions.users.forEach(ment => {
				if(args.indexOf(`<@!${ment.id}>`) > -1) args.splice(args.indexOf(`<@!${ment.id}>`), 1); });
			if(!args.length) return true;
		}

		async function noImage() {
			await message.reply(`I\'m sorry, you need to include the picture you want to set for ${firstWord(player.name)}\'s profile. Usage: \`${p}${cmd.help.usage}\``);
			return;
		}


		let msg;
		await message.reply(`I need to assure, are you certain you want to set this as ${firstWord(player.name)}'s picture? `+
			`I recommend using square (1:1) images.`).then(m => msg = m);
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
						return exit('I see, profile picture assignment canceled.');
				}
			})
			.catch(() => exit('I\'m sorry, it took too long for any reaction.'));

			async function exit(a) {
				await message.reply(a).then(reply => {
					message.delete(4000);
					reply.delete(4000);
					resolve('exit');
				});
			}
		}


		await updateImg();
		const doneMsg = `${firstWord(player.name)}'s ${cmdProfile} picture has been successfully updated!`;
		if(message.guild) await message.channel.send(doneMsg);
		else await message.author.send(doneMsg);

		async function updateImg() {
			const promise = new Promise((resolve, reject) => { updateImg(resolve, reject); })
			.catch(e => { console.log(e); return 'I\'m sorry. Something went wrong'; });
			await promise;

			function updateImg(resolve, reject) {
				conn.query(`UPDATE player SET img = ? WHERE id = ${player.id}`, [img],
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
			name: 'picture',
			aliases: ['img', 'pic', 'image'],
			category: 'Character',
			description: 'Give your character a picture.',
			usage: 'picture [image/gif url]'
		};
	}
};