module.exports = {
	run: async ({message, p}) => {
		const cmdCreate = cmd(process.env.CMD_CREATE),
		cmdProfile = cmd('profile'),
		cmdStats = cmd('stats'),
		cmdActive = cmd('active');

		const cmdSocial = cmd('social'),
		cmdRelation = cmd('relation');

		const cmdPreference = cmd('preference'),
		cmdIllegal = cmd(process.env.CMD_ILLEGAL);

		const cmdStudy = cmd('study'),
		cmdUniversity = cmd('university'),
		cmdJob = cmd('job'),
		cmdWork = cmd('work');

		const cmdRetiring = cmd('retiring'),
		cmdDrop = cmd('drop');

		const cmdPregnant = cmd('pregnant'),
		cmdRandom = cmd('random'),
		cmdDrink = cmd('drink'),
		cmdSex = cmd('sex'),
		cmdDrugs = cmd('drugs'),
		cmdDead = cmd('dead');

		const cmdAchievements = cmd('achievements'),
		cmdAddictions = cmd('addictions'),
		cmdRehab = cmd('rehab');

		const cmdSick = cmd('sick'),
		cmdDoctor = cmd('doctor'),
		cmdReassignment = cmd('reassignment'),
		cmdGive = cmd('give');

		const cmdMarriage = cmd('marriage'),
		cmdDivorce = cmd('divorce');

		const cmdOldest = cmd('oldest'),
		cmdRichest = cmd('richest'),
		cmdDrunkest = cmd('drunkest'),
		cmDirtiest = cmd('dirtiest');

		const cmdPatrons = cmd('patrons'),
		cmdGamblers = cmd('gamblers'),
		cmdWinners = cmd('winners');

		const cmdSlots = cmd('slots'),
		cmdRoulette = cmd('roulette'),
		cmdLottery = cmd('lottery'),
		cmdBalance = cmd('balance'),
		cmdPicture = cmd('picture'),
		cmdRename = cmd('rename'),
		cmdZodiac = cmd('zodiac');

		const cmdPatreon = cmd('patreon'),
		cmdRevive = cmd('revive'),
		cmdSetAge = cmd('setAge'),
		cmdSetZodiac = cmd('setZodiac');

		const cmdUsage = cmd('usage'),
		cmdConfigs = cmd('configs'),
		cmdPrefix = cmd('prefix'),
		cmdPurge = cmd('purge');

		const cmdSupport = cmd('support'),
		cmdReport = cmd('report');

		let embed = {
			color: process.env.CLR_HELP,
			title: 'Usage guide',
			footer: { text: `Use !help for the command list.`, },
			fields: []
		}, preMsg;
		await message.channel.send('Follow this guide if it\'s your first time, ' +
			'or if you just want some useful tips. You\'ll see I can do many things!')
		.then(m => preMsg = m);
		

		(async function embedNavigate(resolve, reject) {
			let i = 0, limit = 2, msg, filter, filters = [];	
			section = declareSections();

			let result;
			do {
				await pushFields();
				result = await waitReaction();
			} while(result.includes('repeat'));


			function declareSections() {
				let a = [];
				cmdAge = cmd('age');
				a.push({
					name: '**Starting a new life** ❤️',
					value: `**First, ${cmdCreate} a new character.** ` +
						`Then, check your ${cmdProfile} for info, or use ${cmdStats} to see how you're feeling! ` +
						`When you think it's time, you can ${cmdAge} and watch the year go by.` +
						`*You can only play with one ${cmdActive} character at a time.*`
				});
				a.push({
					name: '**Interacting with others** 👋',
					value: `Perform ${cmdSocial} actions with any other player. ` +
						`There are ${process.env.EMT_FRIEND} friendly, ` +
						`${process.env.EMT_MEAN} mean and ${process.env.EMT_LOVE} romantic actions. ` +
						`It's all about managing your ${cmdRelation}s!`
				});
				a.push({
					name: '**Privacy and crimes**',
					value: `You can always set your sexual ${cmdPreference}, `+
						'for auto-denying certain romantic actions. ' +
						`There are also ${process.env.EMT_CRIME} ${cmdIllegal} actions, `+
						'but be careful with those, things may end up going wrong.'
				});
				a.push({
					name: '**Living life at it\'s fullest** 🥳',
					value: `Life has been boring? Try living a ${cmdRandom} event! ` +
						`Or just take a ${cmdDrink} and relax. You can try having ${cmdSex} with others, ` +
						`but perhaps ${cmdDrugs} are the solution! But be careful with those, ` +
						`you might end up ${cmdPregnant}, or even ${cmdDead}.`
				});
				a.push({
					name: '**Studying and working** 👨‍🎓',
					value: `You get into school when you turn 4. You can ${cmdStudy} for better grades, ` +
						`and get into ${cmdUniversity} when the time comes. ` +
						`After you\'re done, remember to get a ${cmdJob} and to keep on ${cmdWork}ing! `
				});
				a.push({
					name: '**When the time comes...** 👴',
					value: `After your 50s, it may be worth considering ${cmdRetiring}, ` +
						'or it may start to affect your health! If you\'re young, ' +
						`you may want to ${cmdDrop} out of school, but remember that it's risky.`
				});
				a.push({
					name: '**Achievement or addiction?** 🏆',
					value: `If you do things enough times, you might be rewarded with ${cmdAchievements} ` +
						`or punished with ${cmdAddictions}. If you get addicted, it's better ` +
						`to go to ${cmdRehab}, or bad things might happen to you.`
				});
				a.push({
					name: '**Getting sick and getting paid** 🩺',
					value: `Sometimes in life, you\'ll get ${cmdSick} and need to see ` +
						`a ${cmdDoctor}. Or, perhaps you\'re not feeling well with your gender ` +
						`and want a ${cmdReassignment}. But you\'ll need money! Well, ` +
						`you can ask for a friend to ${cmdGive} you some.`
				});
				a.push({
					name: '**Finding the perfect one** 💒',
					value: 'When you think you\'ve found your soulmate, then perhaps ' +
						`it's time to start arranging the ${cmdMarriage}! ` +
						`It's kinda expensive, but if something goes wrong, ` +
						`at least ${cmdDivorce}s are free.`
				});
				a.push({
					name: '**The world of gamblers** 🎲',
					value: 'A gambler is always full of options of games to play! ' +
						`There are ${cmdSlots} and there is ${cmdRoulette}! The ${cmdLottery} is always open! ` +
						`Also, theres a live update on the best ${cmdGamblers} and on lottery ${cmdWinners}.`
				});
				a.push({
					name: '**Money and user info**',
					value: `Remember to keep your money ${cmdBalance} on check! `+
						`You can set a profile ${cmdPicture} for each one for your characters, `+
						`or rename them anytime using ${cmdRename}. `+
						`Each user receives a diferent ${cmdZodiac} that gives an exclusive bonus;`
				});
				a.push({
					name: '**The online world** 🌐',
					value: 'Want to see how everyone else\'s characters are doing? ' +
						`Take a peek on the our highscores! You can check the ${cmdOldest} and ` +
						`the ${cmdRichest} player, or the ${cmdDrunkest} and the ${cmDirtiest} users! ` +
						`A great thanks to all our ${cmdPatrons} for allowing this.`
				});
				a.push({
					name: '**Premium users** 💎',
					value: `Support me on ${cmdPatreon} and you\'ll be a premium user! ` +
						`This gives you exclusive abilities, like being able to ` +
						`${cmdRevive} your dead, use ${cmdSetAge} on then, or even ` +
						`${cmdSetZodiac} on yourself!`
				});
				a.push({
					name: `**Extra commands** ${process.env.EMT_WARN}`,
					value: 'If you are a server administrator, ' +
					`there are some important ${cmdConfigs} to check. `+
					`You can also set a custom ${cmdPrefix} `+
					`or even ${cmdPurge} some messages.`
				});
				return a;
			}
			
			async function pushFields() {
				if(msg) {
					await msg.clearReactions();
					i = (limit - 2);
					embed.fields = [];
				}
		
				while(i < limit && i < section.length) {
					embed.fields.push(section[i]);
					i++;
				}
				embed.description = `Page ${(limit / 2)}/${Math.ceil(section.length / 2)}`;
		
				if(!msg) {
					await message.channel.send({embed}).then(m => msg = m);
					await message.channel.send(`Please consider joining our ${cmdSupport} server.\n` +
						`And if you find a bug, please remember to ${cmdReport}!`);
				} else await msg.edit({embed});
		
				if(limit > 4) await msg.react(process.env.EMT_FIRST).then(filters.push(process.env.EMT_FIRST));
				if(limit > 2) await msg.react(process.env.EMT_BACK).then(filters.push(process.env.EMT_BACK));
				if(limit < section.length) await msg.react(process.env.EMT_NEXT).then(filters.push(process.env.EMT_NEXT));
				if(limit < (Math.ceil(section.length) - 2)) await msg.react(process.env.EMT_LAST).then(filters.push(process.env.EMT_LAST));
	
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
							case process.env.EMT_FIRST:
								limit = 2;
								return resolve('repeat');
							case process.env.EMT_NEXT:
								limit += 2;
								return resolve('repeat');
							case process.env.EMT_BACK:
								limit -= 2;
								return resolve('repeat');
							case process.env.EMT_LAST:
								limit = Math.ceil(section.length);
								return resolve('repeat');							
						}
					})
					.catch(() => { 
						msg.clearReactions();
						preMsg.edit('*It took too long for any reaction.*\n' +
						`Please, use ${cmdUsage} again for the full tutorial.`);
					});
				}
			}
		})();


		function cmd(a) {
			return `\`${p}${a}\``;
		}
	},	

	config: {},
	
	get help() {
		return {
			name: 'usage',
			aliases: ['tutorial', 'guide', 'tutor'],
			category: 'Support',
			description: 'Usage tutorial.',
			usage: 'tutorial'
		};
	}
};