module.exports = {
	run:({client, message, args, cmd, p}) => {
		let isCommand, isCategory;
		let title = '', text = '';
		arg = args.length && args.join(' ');
		
		if(arg) {
			if(client.categories.has(arg.charAt(0).toUpperCase() + arg.slice(1))) {
				// In case help is aked for a specific command category
				isCategory = true;
				title = 'Category help';
				text = `Use ${p}${cmd.help.usage} for more details.`;				
			} else if(client.commands.has(arg)) {
				// In case help is asked for a specific command
				isCommand = true;
				title = 'Command help';
				text = 'Thank you for using my services.';
			} else {
				// Error message in case of invalid argument
				message.channel.send(`I'm sorry. I can't give you any help about \`${args}\`.`);
				return;
			}
		} else {
			// In case the command !help is used with no argument
			title = 'Command list';
			text = `Use ${p}${cmd.help.usage} for more details.`;
		}

		let embed = {
			color: process.env.CLR_HELP,
			title: title,
			footer: { text: text, },
			fields: []
		};

		if(arg) {
			if(isCategory) {
				// In case help is aked for a specific command category
				const argUpper = arg.charAt(0).toUpperCase() + arg.slice(1);
				const category = client.categories.get(argUpper);
				if(typeof category[0] === 'undefined') {					
					// In case the asked category contain sub-categories
					const cmd = client.commands.get(arg);
					cmd.run({client: client, message: message, args: arg, cmd: cmd});
					return;
				} else {
					// In case the asked category doesn't contain any sub-category
					let value = '';
					category.forEach(categCmd => {
						const cmd = client.commands.get(categCmd);
						value += `**${p}${cmd.help.name}**\n`+
							`${wordsPerLine(cmd.help.description)}\n`;
					});
					embedField(`**${argUpper}**`, value, false);
				}
			} else if(isCommand) {
				// In case help is asked for a specific command
				const c = client.commands.get(arg).help;
				const name = `**${p}${c.name}**`;
				let value = `${wordsPerLine(c.description)}\n`;
				if(c.aliases.length > 0) value += wordsPerLine(`**Aliases**: ${c.aliases.join(', ')}`, 'small') + `\n`;
				value += `**Usage**: \`${p}${c.usage}\``;				
				embedField(name, value);
			}
		} else {
			// In case help is asked is used with no argument
			let fields = [];

			client.categories.keyArray().forEach(category => {
				if(category == 'Testing') return;
				if(Array.isArray(client.categories.get(category))) {
					let value = '';
					client.categories.get(`${category}`, null).forEach(cmd => {
						if(cmd !== 'help') {
							value += `**${p}${cmd}**\n`;
						}
					});
					fields.push({ name: `**${category}**`, value, inline: true });
				}
			});

			let ordened = {};
			fields.forEach(f => {
				let index = f.value.split('\n').length - 1;
				if(!ordened[index]) ordened[index] = [];
				ordened[index].push(f);
			})

			Object.values(ordened).reverse().forEach(f => {
				f.forEach(f => { embed.fields.push(f); }) })
		}

		if(!message.guild) return message.author.send({embed});
		message.channel.send({embed});


		function embedField(name, value, inline = false) {
			embed.fields.push({ name: name, value: value, inline: inline });
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

	config: {},
	
	get help() {
		return {
			name: 'help',
			aliases: ['h'],
			category: 'Support',
			description: 'Show all commands.',
			usage: 'help [command-name]'
		};
	}
};