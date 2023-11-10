const getUserTypeId = (userType) => {
	var user_type_id;
	if (userType === "librarian") {
		user_type_id = "a8adfa00-6680-49b3-bf94-caa8c3f1d823";
	}
	if (userType === "teacher") {
		user_type_id = "a8adfa00-6680-49b3-bf94-caa8c3f1d822";
	}
	if (userType === "student") {
		user_type_id = "a8adfa00-6680-49b3-bf94-caa8c3f1d822";
	}
	return user_type_id;
}

module.exports = { 
	getUserTypeId
};