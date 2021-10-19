const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const users = [
	{
		id: 1,
		username: 'john',
		password: 'john0908',
		isAdmin: true
	},
	{
		id: 2,
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
		// Generate an access token
		const accessToken = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'mysecretkeyis1234', { expiresIn: '50s' });
		res.json({
			id: user.id,
			username: user.username,
			accessToken: accessToken
		});
	} else {
		res.status(400).json('Username or password incorrect!');
	}
});

const verify = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (authHeader) {
		const token = authHeader.split(' ')[1];

		jwt.verify(token, 'mysecretkeyis1234', (err, user) => {
			if (err) {
				return res.status(403).json('Token is not valid!');
			}

			req.user = user;
			next();
		});
	} else {
		res.status(401).json('Your are not authenticated!');
	}
};

app.delete('/api/users/:userId', verify, (req, res) => {
	const id = parseInt(req.params.userId);
	console.log(typeof id, req.user.id === id);

	if (req.user.id === id || req.user.isAdmin) {
		res.status(200).json('User has been deleted');
	} else {
		return res.status(403).json('You are not allowed to delete this user');
	}
});

app.listen(3001, () => {
	console.log('SERVER RUNNING... PORT = 3001');
});
