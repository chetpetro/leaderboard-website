const express = require('express');
const {
    getLeaderboard,
    getLeaderboards,
    createOrEditEntry,
    createMapLeaderboard,
    getMOTW,
    getRecentLeaderboards,
    changeMapDifficultyBonus
} = require("../controllers/leaderboardController");
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();

router.get('/', getLeaderboards); // GET all leaderboards
router.get('/motw', getMOTW); // GET Map of the Week
router.get('/recent', getRecentLeaderboards); // GET the 10 most recently updated leaderboards
router.get('/:steamID', getLeaderboard); // GET one leaderboard by name
router.post('/', createMapLeaderboard); // POST new leaderboard

// Auth required to add leaderboard entry
router.use(requireAuth);
router.patch('/:steamID', createOrEditEntry); // PATCH one leaderboard by name

router.use(requireAdmin);
router.patch('/:steamID/difficultyBonus', changeMapDifficultyBonus); // PATCH one leaderboard's difficulty bonus by name)

module.exports = router;