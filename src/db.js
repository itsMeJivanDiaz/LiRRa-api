const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connection = process.env.POSTGRESQL_CONNECTION_STRING;

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
		console.error(`connection db error ${e.message}`);
	};
};

module.exports = { db };