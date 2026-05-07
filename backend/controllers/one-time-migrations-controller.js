const Leaderboard = require('../models/LeaderboardModel');

async function oneTimeMigrate(req, res) {
    res.status(200).json({ message: 'Nothing to see here :)' });
}

module.exports = { oneTimeMigrate };