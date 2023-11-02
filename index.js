const express = require("express");
const cors = require("cors");

const PORT = 5454;
const app = express();

app.use(cors());

app.get('/ping', (_req, res) => {
	res.send("Pinged");
});

app.listen(PORT, () => console.log(`Running at PORT: ${PORT}`));
