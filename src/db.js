const { Pool } = require('pg');

const connection = "postgres://root:wIHmgOiHoRfGFYaVkE9GG3rnode9Qy3T@dpg-cl1ocjop2gis73fh3k10-a.singapore-postgres.render.com/lirra_postgress?sslmode=no-verify";

const pool = new Pool({
	connectionString: connection,
	max: 20,
	idleTimeoutMillis: 30000
});

const db = async () => {
	let client;
	try {
		client = await pool.connect();
		return client;
	} catch (e) {
		console.log(e);
		return null;
	};
};

module.exports = { db };