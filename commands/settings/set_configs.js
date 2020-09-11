module.exports = {
	run: async ({client, message, args, p, cmd, conn, configs = {}})=> {
		const cmdConfigsUse = `\`${p}${cmd.help.usage}\``;
		const cmdConfigs = `\`${p}${cmd.help.name}\``;

		let embed = {
			color: process.env.CLR_HELP,
			fields: []
		}, preMsg;		
		await message.channel
		.send(`React with \`${process.env.EMT_ONE}\`, \`${process.env.EMT_TWO}\``+
		`or \`${process.env.EMT_THREE}\` to toggle the selected option, or just use ${cmdConfigsUse} to quickly toggle it.\n`)
		.then(m => preMsg = m);
		
		const settings = Object.values(client.data.get('configs'));

		let msg, i = 0;
		(async function setConfigs() {
			const toggle = await embedNavigate();
			if(toggle == 'timeout') return;
	
			async function embedNavigate(resolve, reject) {
				const perPage = 3;
				let limit = perPage, filter, filters = [], opts = [];
	
				let result;
				do {
					await pushFields();
					result = await waitReaction();
				} while([result].includes('repeat'));
				return result;
	
				async function pushFields() { // jshint ignore:line
					if(msg) {
						await msg.clearReactions();
						opts = [], filters = [];
						i = (limit - perPage);
						embed.fields = [];
					}
	
					while(i < limit && i < settings.length) {
						const c = settings[i];
						let name = `**${c.name}**`;
						const set = (configs[c.set] == 1) ? true : false;
	
						if(perPage == 3) if(opts.length == 2) {
							opts[2] = { set: c.set, name: c.name, current: set };
							name += ` ${process.env.EMT_THREE}`; }
						if(perPage >= 2) if(opts.length == 1) {
							opts[1] = { set: c.set, name: c.name, current: set };
							name += ` ${process.env.EMT_TWO}`; }
						if(opts.length == 0) {
							opts[0] = { set: c.set, name: c.name, current: set };
							name += ` ${process.env.EMT_ONE}`; }
						name += `   *currently ${(set) ? 'enabled' : 'disabled'}*`;
						
						embed.fields.push({ name: name, value: c.desc });
						i++;
					}
					embed.description = `Page ${(limit / perPage)}/${Math.ceil(settings.length / perPage)}`;
			
					if(!msg) {
						if(!message.guild) await message.author.send({embed}).then(m => msg = m);
						else await message.channel.send({embed}).then(m => msg = m);
					} else await msg.edit({embed});
			
					if(limit > perPage) await msg.react(process.env.EMT_BACK).then(filters.push(process.env.EMT_BACK));				
					if(opts[0]) await msg.react(process.env.EMT_ONE).then(filters.push(process.env.EMT_ONE));
					if(perPage >= 2) if(opts[1]) await msg.react(process.env.EMT_TWO).then(filters.push(process.env.EMT_TWO));
					if(perPage == 3) if(opts[2]) await msg.react(process.env.EMT_THREE).then(filters.push(process.env.EMT_THREE));
					if(limit < settings.length) await msg.react(process.env.EMT_NEXT).then(filters.push(process.env.EMT_NEXT));
		
					filter = (reaction, author) => { return filters.includes(reaction.emoji.name) && author.id === message.author.id; };
				}
		
				async function waitReaction() {
					const promise = new Promise((resolve, reject) => { waitReaction(resolve, reject); })
					.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
					const res = await promise;
					return res;
		
					async function waitReaction(resolve, reject) { // jshint ignore:line
						msg.awaitReactions(filter, {max: 1, time: 120000, errors: ['time']})
						.then(async collected => {
							const reaction = collected.first();
							switch(reaction.emoji.name) {
								case process.env.EMT_NEXT:
									limit += perPage;
									return resolve('repeat');
								case process.env.EMT_BACK:
									limit -= perPage;
									return resolve('repeat');
								case process.env.EMT_ONE:
									return resolve(opts[0]);
								case process.env.EMT_TWO:
									return resolve(opts[1]);
								case process.env.EMT_THREE:
									return resolve(opts[2]);
							}
						})
						.catch(async () => { 
							await preMsg.edit('*It took too long for any reaction.*\n' +
							`Please, use ${cmdConfigs} again if you\'re still interested.`);
							msg.clearReactions();
							resolve('timeout');
						});
					}
				}
			}
			
	
			const setTo = !toggle.current;
			await updateSettings(toggle.set, setTo);
			await message.channel
			.send(`\`${toggle.name}\` successfully toggled to ${(setTo) ? 'enabled' : 'disabled'}!`);
			setConfigs();
	
			async function updateSettings(set, setTo) {
				const promise = new Promise((resolve, reject) => { updateSettings(resolve, reject); })
				.catch(e => { console.log(e); return message.reply('I\'m sorry. Something went wrong.'); });
				await promise;
				
				function updateSettings(resolve, reject) {
					const query = `UPDATE configs SET ${set} = ? WHERE server = ?`;
					conn.query(query, [setTo, message.guild.id], function(error, results, fields) {
						if(error) throw error;
						configs[set] = (setTo) ? 1 : 0;
						resolve();
					}).on('error', (err) => { sqlHandle(err); });
				}
			}
		})();


		function sqlHandle(err) {
			message.reply('I\'m sorry. Something went wrong.');
			console.log('Sorry. An error ocurred. ------------------------------\n' +
				`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
		}
	},

	config: {
		onlyGuilds: true,
		onlyAdmins: true,
	},
	
	get help() {
		return {
			name: 'configs',
			aliases: ['configurations', 'confs', 'setting', 'settings'],
			category: 'Settings',
			description: 'Access the configurable variables.',
			usage: 'configs [config-name]'
		};
	}
};