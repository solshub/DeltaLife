module.exports = {
	run: async ({message, player}) => {
		let data = { job: player.job, cars: player.cars, houses: player.houses, children: [] };
		data.children = player.children.others.length && data.children.concat(player.children.others);
		data.children = player.children.male.length && data.children.concat(player.children.male);
		data.children = player.children.female.length && data.children.concat(player.children.female);


		let cars = {}, houses = {};		
		if(data.cars || data.houses) {
			if(data.cars.length) cars = calcValue(data.cars);
			if(data.houses.length) houses = calcValue(data.houses); }

		function calcValue(a) {
			let value = 0, debt = 0;
			a.forEach(prop => {
				value += prop.value;
				debt += prop.loan; });
			return { value, debt };
		}

		
		netWorth = player.cash;

		if(player.degree.loan && player.degree.paidin)
			netWorth -= player.degree.loan * player.degree.paidin;

		if(cars.value) netWorth += cars.value;
		if(cars.debt) netWorth -= cars.debt;

		if(houses.value) netWorth += houses.value;
		if(houses.debt) netWorth -= houses.debt;


		let embed = {
			author: {
				color: process.env.CLR_HELP,
				name: `${player.name}'s bank account`,
				icon_url: message.author.avatarURL
			},
			fields: [					
				{ name: '**Cash** ' + process.env.EMT_CASH,
				value: `Bank balance: \`${cashSign(player.cash)}\``+
				`\nNet worth: \`${cashSign(netWorth)}\`` },
			],
		};

		let str = '';
		if(player.degree.loan && player.degree.paidin) {
			str += `\`$${parseFloat(player.degree.loan * player.degree.paidin).toFixed(2)}\` in ` +
				`student loan,\nto be paid in ${player.degree.paidin} month${(player.degree.paidin > 1) ? 's' : ''}`
		}
		if(str) str += '\n';
		if(data.cars) if(data.cars.length > 0) {
			let carLoan = 0;
			let carMonths = 0;
			data.cars.forEach(c => {
				if(!c.loan) return;
				if(!c.paidin) return;
				carLoan += c.loan * c.paidin;
				if(c.paidin > carMonths) carMonths = c.paidin;
			});
			if(carLoan) str += `\`$${parseFloat(carLoan).toFixed(2)}\` in ` +
				`${data.cars.length} car loan${(data.cars.length > 1) ? 's' : ''},\n` +
				`to be paid in ${carMonths} month${(carMonths > 1) ? 's' : ''}.`;
		}
		if(str) str += '\n';
		if(data.houses) if(data.houses.length > 0) {
			let houseLoan = 0;
			let houseMonths = 0;
			data.houses.forEach(h => {
				if(!h.loan) return;
				if(!h.paidin) return;
				houseLoan += h.loan * h.paidin;
				if(h.paidin > houseMonths) houseMonths = h.paidin;
			});
			if(houseLoan) str += `\`$${parseFloat(houseLoan).toFixed(2)}\` in ` +
				`${data.houses.length} mortgage${(data.houses.length > 1) ? 's' : ''},\n` +
				`to be paid in ${houseMonths} month${(houseMonths > 1) ? 's' : ''}.`;
		}
		if(str) embed.fields.push({ name: '**Loans** ' +
			process.env.EMT_ROB, value: str });

		str = '';
		if(data.cars) if(data.cars.length > 0) {
			str += `${data.cars.length} cars, `+
				`worth \`$${parseFloat(cars.value).toFixed(2)}\` total.`; }
		if(str) str += '\n';
		if(data.houses) if(data.houses.length > 0) {
			str += `${data.houses.length} houses, worth `+
				`\`$${parseFloat(houses.value).toFixed(2)}\` total.`; }
		if(str) embed.fields.push({ name: '**Properties** ' +
			process.env.EMT_STATE, value: str });

		message.channel.send({ embed });		
		

		function cashSign(a) {
			return a >= 0 ? '$' + parseFloat(a).toFixed(2) : '-$' + parseFloat(a * -1).toFixed(2);
		}
	},

	config: {
		player: true
	},
	
	get help() {
		return {
			name: 'balance',
			aliases: ['cash', 'bank'],
			category: 'Reports',
			description: 'Check your character money balance.',
			usage: 'balance'
		};
	}
};