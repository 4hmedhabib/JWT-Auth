require('dotenv').config();
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const whitelist = [ 'http://localhost:3002' ];
const corsOptions = {
	origin: function(origin, callback) {
		if (whitelist.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			throw new Error({ message: 'Not allowd' });
		}
	}
};

app.use(cors(corsOptions));

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

let refreshTokens = [];

const generateAccessToken = (user) => {
	return jwt.sign({ id: user.id, isadmin: user.isAdmin }, process.env.SECRET_KEY, { expiresIn: '1m' });
};

const generateRefreshToken = (user) => {
	return jwt.sign({ id: user.id, isadmin: user.isAdmin }, process.env.REFRESH_SECRET_KEY, { expiresIn: '15m' });
};

app.post('/api/refresh', (req, res) => {
	// take the refresh token from the user
	const refreshToken = req.body.token;

	//send error if there is no token or it's invalid
	if (!refreshToken) return res.status(401).json('You are not authenticated!');
	if (!refreshTokens.includes(refreshToken)) return res.status(401).json('Refresh token is not valid');
	jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err, user) => {
		err && console.log(err.message, err);

		refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

		const newAccessToken = generateAccessToken(user);
		const newRefreshToken = generateRefreshToken(user);

		refreshTokens.push(newRefreshToken);

		res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken, tokens: refreshTokens });
	});

	// if everything is ok, create new access token, refresh token and send to user
});

app.post('/api/login', (req, res) => {
	console.log('Running............');
	const { username, password } = req.body;

	const user = users.find((u) => {
		return u.username === username && u.password === password;
	});

	if (user) {
		const accessToken = generateAccessToken(user);
		const refreshToken = generateRefreshToken(user);
		refreshTokens.push(refreshToken);
		res.json({
			id: user.id,
			username: user.username,
			accessToken: accessToken,
			refreshToken: refreshToken
		});
	} else {
		res.status(400).json('Username or password incorrect!');
	}
});

const verify = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (authHeader) {
		const token = authHeader.split(' ')[1];

		jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
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

app.post('/api/logout', verify, (req, res) => {
	const refreshToken = req.body.token;
	refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
	res.status(200).json('You logged out successfully');
});

app.listen(5000, () => {
	console.log('SERVER RUNNING... PORT = 5000');
});
