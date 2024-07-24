const express = require('express');
const newFeaturedLeaderboard = require('../controllers/cronController');

const router = express.Router();

router.get("/newFeaturedLeaderboard", newFeaturedLeaderboard);

module.exports = router;