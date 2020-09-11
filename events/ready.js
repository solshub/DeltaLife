module.exports = async (client, conn) => {
	console.log(`All systems online, welcome. Connected with ${client.guilds.size} servers.`);
	client.user.setPresence({status: 'online', game: {name: process.env.GAME}});

	for(g of client.guilds) { await checkSettings(g[0]); }

	async function checkSettings(guild) {
		const promise = new Promise((resolve, reject) => { checkSettings(resolve, reject); })
		.catch(e => { console.log(e); console.log('I\'m sorry. Something went wrong.'); });
		await promise;

		async function checkSettings(resolve, reject) {
			conn.query(`SELECT id FROM configs WHERE server = ${guild}`, function(error, results, fields) {
				if(error) throw error;
				if(results.length) return resolve();
				conn.query(`INSERT INTO configs(server) VALUES(${guild})`, function(error, results, fields) {
					if(error) throw error;
					resolve();
				});
			}).on('error', (err) => { sqlHandle(err); });
		}
	}

	
	function sqlHandle(err) {
		console.log('Sorry. An error ocurred. ------------------------------');
		console.log(`Error: ${err.code}, ${err.sqlMessage}\nQuery: ${err.sql}`);
	}
};