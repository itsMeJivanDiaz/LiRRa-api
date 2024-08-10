const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const { db } = require('./db');
const { cryptPassword, comparePassword, verifyToken, getJwtToken, verifyRefreshToken } = require('./helper');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT;
const app = express();

var client;
var jsonParser = bodyParser.json();

app.use(cors());

const apiCall = async (params, queryString, res) => {
	client = await db();
	try {
		const query = {
			text: queryString,
			values: params
		};
		const data = await client.query(query);
		if (data) {
			return data;
		}
	} catch (e) {
		error(e, res);
	} finally {
		if (client) {
			client.release();
		}
	}
};

const unauthorized = (res) => {
	res.status(403).json({
		response: 'unauthorized request'
	});
};

const error = (response, res) => {
	res.status(500).json({
		response: response.message
	});
};

const success = (response, res) => {
	res.status(200).json({
		response: response
	});
};

app.get('/api/server-ping', (_req, res) => {
	success('server-pong', res);
});

app.get('/api/pg-ping', async (_req, res) => {
	try {
		client = await db();
		success(client, res);
	} catch (e) {
		error(e, res);
	} finally {
		if (client) {
			client.release();
		}
	};
});

// USER_AUTH_SECTION

// USER_AUTHENTICATION

app.post('/api/user/auth', jsonParser, async (_req, res) => {
	try {
		const {
			user_email,
			user_password
		} = _req.body;
		const queryString = "SELECT * FROM lirra.user WHERE user_email = $1;";
		const params = [user_email];
		const result = await apiCall(params, queryString);
		const data = result.rows[0];
		if (data === undefined) {
			error({ message: "wrong password or email" }, res);
			return;
		}
		if (!await comparePassword(user_password, data.user_password)) {
			error({ message: "wrong password or email" }, res);
			return;
		}
		const jwt = getJwtToken(data);
		success(jwt, res);
	} catch (e) {
		error(e, res);
	};
});

// USER_REFRESH_TOKEN

app.post('/api/user/refresh', jsonParser, async (_req, res) => {
	try {
		const {
			refresh_token,
			user_id
		} = _req.body;
		if (!refresh_token) {
			unauthorized(res);
			return;
		}
		if (!await verifyRefreshToken(refresh_token, user_id)) {
			unauthorized(res);
			return;
		}
		const data = jwt.decode(refresh_token);
		delete data.iat;
		delete data.exp;
		const newJwt = getJwtToken(data);
		success(newJwt, res);
	} catch (e) {
		error(e, res);
	}
});

// USER_SECTION

// INSERT_USER
app.post('/api/user', jsonParser, async (_req, res) => {
	try {
		const userId = uuidv4();
		const { 
			first_name,
			middle_name,
			last_name,
			user_email,
			user_password,
			user_type_id
		} = _req.body;
		const password = await cryptPassword(user_password);
		const queryString = `
			INSERT INTO lirra.user(user_id, first_name, middle_name, last_name, user_email, user_password, user_type_id) 
			VALUES($1, $2, $3, $4, $5, $6, $7);
		`;
		const params = [
			userId, 
			first_name, 
			middle_name, 
			last_name, 
			user_email, 
			password, 
			user_type_id
		];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	}
});

// READ_USER

app.get('/api/user/:id', async (_req, res) => {
	try {
		const id = _req.params.id;
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const queryString = "SELECT * FROM lirra.user WHERE user_id = $1;";
		const params = [id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success(result.rows, res);
		}
	} catch (e) {
		error(e, res);
	};
});

// UPDATE_USER

app.patch('/api/user/:id', jsonParser, async (_req, res) => {
	try {
		const id = _req.params.id;
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const { 
			first_name,
			middle_name,
			last_name,
			user_email,
			user_type_id
		} = _req.body;
		const queryString = "UPDATE lirra.user SET first_name = $1, middle_name = $2, last_name = $3, user_email = $4, user_type_id = $5 WHERE user_id = $6;";
		const params = [first_name, middle_name, last_name, user_email, user_type_id, id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	};
});

// DELETE_USER

app.delete('/api/user/:id', async (_req, res) => {
	try {
		const id = _req.params.id;
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const queryString = "DELETE FROM lirra.user WHERE user_id = $1;";
		const params = [id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	};
});

// COURSE_SECTION

// INSERT_COURSE

app.post('/api/course', jsonParser, async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const courseId = uuidv4();
		const { course_name } = _req.body;
		const queryString = "INSERT INTO lirra.course(course_id, course_name) VALUES($1, $2);";
		const params = [courseId, course_name];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	};
});

// READ_COURSE

app.get('/api/course/:id', async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const id = _req.params.id;
		const queryString = "SELECT * FROM lirra.course WHERE course_id = $1;";
		const params = [id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success(result.rows, res);
		}
	} catch (e) {
		error(e, res);
	};
});

// UPDATE_COURSE

app.patch('/api/course/:id', jsonParser, async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const id = _req.params.id;
		const { course_name } = _req.body;
		const queryString = "UPDATE lirra.course SET course_name = $1 WHERE course_id = $2;";
		const params = [course_name, id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	};
});

// DELETE_COURSE

app.delete('/api/course/:id', async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const id = _req.params.id;
		const queryString = "DELETE FROM lirra.course WHERE course_id = $1;";
		const params = [id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	};
});

// LIBRARY_RESOURCE_SECTION

// INSERT_LIBRARY_RESOURCE

app.post('/api/library-resource', jsonParser, async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const libResourceId = uuidv4();
		const {
			title,
			author,
			date_published,
			place_published,
			publisher,
			keywords,
			description,
			recommendation_count,
			in_library,
			metadata,
			course_id,
			resource_type_id
		} = _req.body;
		const queryString = `
			INSERT INTO
			lirra.library_resource(library_resource_id, title, author, date_published, place_published, publisher, keywords, description, recommendation_count, in_library, metadata, resource_type_id, course_id)
			VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
		`;
		const params = [
			libResourceId,
			title,
			author,
			date_published,
			place_published,
			publisher,
			keywords,
			description,
			recommendation_count,
			in_library,
			metadata,
			resource_type_id,
			course_id,
		];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	};
});

// READ_LIBRARY_RESOURCE

app.get('/api/library-resource/:id', async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const id = _req.params.id;
		const queryString = "SELECT * FROM lirra.library_resource WHERE library_resource_id = $1;";
		const params = [id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success(result.rows, res);
		}
	} catch (e) {
		error(e, res);
	};
});

// UPDATE_LIBRARY_RESOURCE

app.patch('/api/library-resource/:id', jsonParser, async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const id = _req.params.id;
		const {
			title,
			author,
			date_published,
			place_published,
			publisher,
			keywords,
			description,
			recommendation_count,
			in_library,
			metadata,
		} = _req.body;
		const queryString = `
			UPDATE lirra.library_resource
			SET title = $1, author = $2, date_published = $3, place_published = $4, publisher = $5, keywords = $6, description = $7, recommendation_count = $8, in_library = $9, metadata = $10
			WHERE library_resource_id = $11;
		`;
		const params = [
			title,
			author,
			date_published,
			place_published,
			publisher,
			keywords,
			description,
			recommendation_count,
			in_library,
			metadata,
			id,
		];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	};
});

// DELETE_LIBRARY_RESOURCE

app.delete('/api/library-resource/:id', async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const id = _req.params.id;
		const queryString = "DELETE FROM lirra.library_resource WHERE library_resource_id = $1;";
		const params = [id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	};
});

// RECOMMENDATION_SECTION

// INSERT RECOMMENDATION

app.post('/api/recommendation', jsonParser, async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const recommendationId = uuidv4();
		const {
			user_id,
			library_resource_id
		} = _req.body;
		const queryString = `
			INSERT INTO lirra.recommendation(recommendation_id, user_id, library_resource_id)
			VALUES($1, $2, $3);
		`;
		const params = [recommendationId, user_id, library_resource_id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	};
});

// READ_RECOMMENDATION

app.get('/api/recommendation/:id', async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const id = _req.params.id
		const queryString = "SELECT * FROM lirra.recommendation WHERE recommendation_id = $1;";
		const params = [id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success(result.rows, res);
		}
	} catch (e) {
		error(e, res);
	};
});

// UPDATE_READ_RECOMMENDATION

app.patch('/api/recommendation/:id', jsonParser, async (_req, res) => {
	try {
		const headers = _req.headers;
		const authorization = headers.authorization;
		if (!await verifyToken(authorization)) {
			unauthorized(res);
			return;
		}
		const id = _req.params.id
		const {
			user_id,
			library_resource_id
		} = _req.body;
		const queryString = "UPDATE lirra.recommendation SET user_id = $1, library_resource_id = $2 WHERE recommendation_id = $3;";
		const params = [user_id, library_resource_id, id];
		const result = await apiCall(params, queryString, res);
		if (result) {
			success('success', res);
		}
	} catch (e) {
		error(e, res);
	};
});

app.listen(PORT, () => console.log(`Running at PORT: ${PORT}`));
