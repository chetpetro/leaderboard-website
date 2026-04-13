const express = require('express');
const { newFeaturedLeaderboard, previewMotwMessage } = require('../controllers/cronController');
const requireCronSecret = require('../middleware/requireCronSecret');

const router = express.Router();

router.get("/newFeaturedLeaderboard", requireCronSecret, newFeaturedLeaderboard);
router.get("/newFeaturedLeaderboard/preview", requireCronSecret, previewMotwMessage);

module.exports = router;