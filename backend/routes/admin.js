const express = require('express');
const { deleteEntryByMapAndDiscord, deleteMotwEntryByMapAndDiscord } = require('../controllers/leaderboardController');
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

module.exports = router;

