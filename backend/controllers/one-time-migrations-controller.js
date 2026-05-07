const Leaderboard = require('../models/LeaderboardModel');

async function oneTimeMigrate(req, res) {
    try {
        await Leaderboard.deleteOne({ steamID: '3718005142', entries: { $size: 0 } });
        res.status(200).json({ message: 'Migration completed successfully' });
    } catch (error) {
        console.log(error);
    }
}

module.exports = { oneTimeMigrate };