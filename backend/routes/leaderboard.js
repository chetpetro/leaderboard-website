const express = require('express');
const {
    getLeaderboard,
    getLeaderboards,
    createMapLeaderboard,
    getMOTW,
    getRecentLeaderboards,
    changeMapDifficultyBonus,
    getEntriesByUser
} = require("../controllers/leaderboard/publicController");
const {
    createCustomLeaderboard
} = require("../controllers/leaderboard/customController");
const {
    createOrEditEntry,
    createMotwEntry
} = require("../controllers/leaderboard/submissionController");
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();

router.get('/', getLeaderboards); // GET all leaderboards
router.get('/motw', getMOTW); // GET Map of the Week
router.get('/recent', getRecentLeaderboards); // GET the 10 most recently updated leaderboards
router.get('/entries', getEntriesByUser); // GET all entries for a user
router.get('/:mapKey', getLeaderboard); // GET one leaderboard by key
router.post('/', createMapLeaderboard); // POST new leaderboard
router.post('/custom', requireAuth, requireAdmin, createCustomLeaderboard); // POST custom leaderboard

// Auth required to add leaderboard entry
router.use(requireAuth);
router.patch('/:mapKey/motw', createMotwEntry); // PATCH one featured map MOTW entry
router.patch('/:mapKey', createOrEditEntry); // PATCH one leaderboard by key

router.use(requireAdmin);
router.patch('/:mapKey/difficultyBonus', changeMapDifficultyBonus); // PATCH one leaderboard's difficulty bonus by key)

module.exports = router;