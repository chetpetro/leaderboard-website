const express = require('express');
const { deleteEntryByMapAndDiscord, deleteMotwEntryByMapAndDiscord, deleteLeaderboardBySteamID, logMapPointsForLeaderboard } = require('../controllers/leaderboardController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/status', (req, res) => {
	res.status(200).json({ isAdmin: true });
});

router.delete('/leaderboards/:steamID/entries/:discordID', deleteEntryByMapAndDiscord);
router.delete('/leaderboards/:steamID/motw/entries/:discordID', deleteMotwEntryByMapAndDiscord);
router.delete('/leaderboards/:steamID', deleteLeaderboardBySteamID);
router.get('/leaderboards/:steamID/map-points', logMapPointsForLeaderboard);

module.exports = router;

