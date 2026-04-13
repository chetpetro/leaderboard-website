const express = require('express');
const {
    getLeaderboard,
    getLeaderboards,
    createEntry,
    createLeaderboard,
    getMOTW,
    getRecentLeaderboards
} = require("../controllers/leaderboardController");
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

router.get('/', getLeaderboards); // GET all leaderboards
router.get('/motw', getMOTW); // GET Map of the Week
router.get('/recent', getRecentLeaderboards); // GET the 10 most recently updated leaderboards
router.get('/:steamID', getLeaderboard); // GET one leaderboard by name
router.post('/', createLeaderboard); // POST new leaderboard

// Auth required to add leaderboard entry
router.use(requireAuth);
router.patch('/:steamID', createEntry); // PATCH one leaderboard by name

module.exports = router;