const express = require('express');
const { deleteEntryByMapAndDiscord, deleteMotwEntryByMapAndDiscord, deleteLeaderboardBySteamID, logMapPointsForLeaderboard, recomputeMapPointsAdmin } = require('../controllers/leaderboard/adminController');
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
router.post('/leaderboards/:steamID/recompute-map-points', recomputeMapPointsAdmin);

module.exports = router;

