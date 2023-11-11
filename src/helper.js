const bcrypt = require('bcrypt');

const cryptPassword = async (password) => {
	const hash = await bcrypt.hash(password, 10);
	return hash;
};

module.exports = { 
	cryptPassword
};