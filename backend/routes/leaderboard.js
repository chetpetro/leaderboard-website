const express = require('express');
const {
    getLeaderboard,
    getLeaderboards,
    createEntry,
    createLeaderboard
} = require("../controllers/leaderboardController");

const router = express.Router();

router.get('/', getLeaderboards); // GET all leaderboards
router.get('/:name', getLeaderboard); // GET one leaderboard by name
router.post('/', createLeaderboard); // POST new leaderboard
router.patch('/:name', createEntry); // PATCH one leaderboard by name

module.exports = router;