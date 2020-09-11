require('dotenv').config();

const Discord = require('discord.js');
const { readdirSync } = require('fs');
const Enmap = require('enmap');
const mysql = require('mysql');
const moment = require('moment');
const conn = mysql.createPool({
	connectionLimit: 50,
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'alpha_bot'
});

const client = new Discord.Client();
client.startTime = Date.now();
console.log(`Booting up. It's ${ moment().format('lll') } now.`);

client.gifs = new Enmap();
loadJson('./database/images/gifs.json', client.gifs);
client.images = new Enmap();
loadJson('./database/images/images.json', client.images);

client.data = new Enmap();
loadJson('./database/settings.json', client.data, 'configs');
loadJson('./database/timeouts.json', client.data, 'timeout');

loadJson('./database/countries.json', client.data, 'country');
loadJson('./database/genders.json', client.data, 'gender');

loadJson('./database/jobs.json', client.data, 'job');
loadJson('./database/degrees.json', client.data, 'degree');

loadJson('./database/titles.json', client.data, 'title');
loadJson('./database/achievs.json', client.data, 'achiev');
loadJson('./database/addicts.json', client.data, 'addict');

loadJson('./database/diseases.json', client.data, 'sick');
loadJson('./database/preferences.json', client.data, 'sexual');
loadJson('./database/zodiacs.json', client.data, 'zodiac');

loadJson('./database/events/drinks.json', client.data, 'drink');
loadJson('./database/events/drugs.json', client.data, 'drug');
loadJson('./database/events/random.json', client.data, 'random');
loadJson('./database/events/questions.json', client.data, 'question');
loadJson('./database/events/emotes.json', client.data, 'emote');

loadJson('./database/swears.json', client.data, 'swear');

client.gamble = new Enmap();
loadJson('./database/gamble/slots.json', client.gamble, 'slots');

// Sets id attribute in each title
let titles = client.data.get('title', null);
for(let i = 0; i < Object.values(titles).length; i++) {
	let el = client.data.get('title', i);
	el.id = i;
	client.data.set('title', i, el);	
}
titles = client.data.get('title', null);
delete titles['object Object'];
client.data.set('title', titles);

console.log(`All data succesfully loaded.`);

function loadJson(path, map, lib) {		
	const json = require(path);
	Object.keys(json).forEach(key => {
		if(lib) map.set(lib, json[key], key);
		else map.set(key, json[key]);
	});
}

client.commands = new Enmap();

client.categories = new Enmap();
loadModules('./commands/action/');

loadModules('./commands/gambling/');
loadModules('./commands/character/');
loadModules('./commands/online/');
loadModules('./commands/premium/');
loadModules('./commands/report/');
loadModules('./commands/settings/');
loadModules('./commands/support/');
loadModules('./commands/utility/');
loadModules('./commands/world/');

loadModules('./actions/');
loadModules('./actions/negative/', true);
loadModules('./actions/positive/', true);
loadModules('./actions/romantic/', true);

function loadModules(path, action) {
	const name = action ? 'action' : 'command';
	const f = readdirSync(path);
	let i = 0;
	f.forEach(f => {
		if(f.split('.').slice(-1)[0] !== 'js') return;		
		try {
			const props = require(`${path}${f}`);
			loadFile(props, f);
			i++;
		} catch(e) {
			console.log(`${name} ${f} could not be executed: \n${e}`);
			process.exit(4);
		}
	});
	if(i > 0) console.log(`Loading ${i} ${name} ${(i > 1) ? `modules` : `module`}...`);

	function loadFile(props, f) {
		if(props.init) props.init(client);
	
		// Catalogs every name to it's command
		client.commands.set(props.help.name, props);
		if(props.help.aliases) {
			props.alias = true;
			props.help.aliases.forEach(alias => client.commands.set(alias, props)); }
	
		// Catalogs every category with it's subjacent commands
		const name = props.help.name;
		const categ = props.help.category;
		const category = client.categories;
		if(typeof categ === 'object') {
			const key = Object.keys(categ)[0];
			const value = Object.values(categ)[0];
			if(category.has(key)) {
				if(category.has(key, value))
					category.push(key, name, value);
				else category.set(key, [name], value);
			} else category.set(key, [name], value);
		} else {
			if(category.has(categ))
				category.push(categ, name);
			else category.set(categ, [name]);
		}
	}
}

const eventFiles = readdirSync('./events/');
console.log(`All ${eventFiles.length} event handler modules loaded.`);

eventFiles.forEach(f => {
	const eventName = f.split('.')[0];
	const event = require(`./events/${f}`);
	client.on(eventName, event.bind(null, client, conn));
});

client.on('error', (err) => {
	console.log('Sorry. An error ocurred: ', err);
	process.exit(2);
});

conn.on('error', (err) => {
	console.log('Sorry. An error ocurred: ', err);
	process.exit(3);
});

process.on('exit', (code) => {
	conn.end();
	console.log(`ERROR CODE ${code}`);
});

const token = require('token.json');
client.login(token);