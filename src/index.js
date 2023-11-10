const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const { db } = require('./db');
const { getUserTypeId } = require('./helper');
const { v4: uuidv4 } = require('uuid');

const PORT = 5454;
const app = express();

var client;
var jsonParser = bodyParser.json();

app.use(cors());

app.get('/server-ping', (_req, res) => {
	res.status(200).json({
		response: 'server-pong'
	});
});

app.get('/pg-ping', async (_req, res) => {
	try {
		client = await db();
		return res.status(200).json({
			response: client
		});
	} catch (e) {
		return res.status(500).json({
			response: e
		});
	} finally {
		if (client) {
			client.release();
		}
	};
});

app.post('/sign-up', jsonParser, async (_req, res) => {
	try {
		client = await db();
		
		const userId = uuidv4();
		
		const { 
			first_name,
			middle_name,
			last_name,
			user_email,
			user_password,
			user_type
		} = _req.body;

		const user_type_id = getUserTypeId(user_type);

		const query = {
			text: "INSERT INTO lirra.user(user_id, first_name, middle_name, last_name, user_email, user_password, user_type_id) VALUES($1, $2, $3, $4, $5, $6, $7);",
			values: [userId, first_name, middle_name, last_name, user_email, user_password, user_type_id]
		};

		await client.query(query);

		return res.status(200).json({
			response: 'success'
		});

	} catch (e) {
		return res.status(500).json({
			response: e.message
		});
	} finally {
		if (client) {
			client.release();
		}
	};
});

app.listen(PORT, () => console.log(`Running at PORT: ${PORT}`));
