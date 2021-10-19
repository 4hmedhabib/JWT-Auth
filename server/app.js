const express = require('express');
const app = express();

app.use(express.json());

const users = [
	{
		username: 'john',
		password: 'john0908',
		isAdmin: true
	},
	{
		username: 'jane',
		password: 'jane0908',
		isAdmin: false
	}
];

app.post('/api/login', (req, res) => {
	const { username, password } = req.body;

	const user = users.find((u) => {
		return u.username === username && u.password === password;
	});

	if (user) {
		res.json(user);
	} else {
		res.status(400).json('Username or password incorrect!');
	}
});

app.listen(3001, () => {
	console.log('SERVER RUNNING... PORT = 3001');
});
