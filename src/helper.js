const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const cryptPassword = async (password) => {
	try {
		const hash = await bcrypt.hash(password, 10);
		return hash;
	} catch (e) {
		console.log(e);
	};
};

const comparePassword = async (password, hash) => {
	try {
		return await bcrypt.compare(password, hash);
	} catch (e) {
		console.log(e);
	};
};

const getJwtToken = (data) => {
	const refresh_token = jwt.sign(data, process.env.JWT_SECRET_KEY, {"expiresIn": "7d"});
	const access_token = jwt.sign(data, process.env.JWT_SECRET_KEY, {"expiresIn": "1d"});
	return { access_token, refresh_token };
};

const verifyRefreshToken = async (refreshToken, id) => {
	try {
		if (!refreshToken) {
			return false;
		}
		var jwtToken = refreshToken;
		const tokenParse = jwt.decode(jwtToken);
		const exp = tokenParse.exp;
		if (new Date(exp * 1000) <= new Date()) {
			return false;
		}
		const isVerified = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY) && tokenParse.user_id === id;
		if (!isVerified) {
			return false;
		}
		return true;
	} catch (e) {
		console.log(e);
	};
};

const verifyToken = async (token) => {
	try {
		if (!token) {
			return false;
		}
		var jwtToken = token;
		if (token.includes("Bearer")) {
			jwtToken = token.split(' ')[1];
		}
		const tokenParse = jwt.decode(jwtToken);
		const exp = tokenParse.exp;
		if (new Date(exp * 1000) <= new Date()) {
			return false;
		}
		const isVerified = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
		if (!isVerified) {
			return false;
		}
		return true;
	} catch (e) {
		console.log(e);
	};
};

module.exports = { 
	cryptPassword,
	comparePassword,
	verifyToken,
	getJwtToken,
	verifyRefreshToken
};