const express = require('express');
const newFeaturedLeaderboard = require('../controllers/cronController');

const router = express.Router();

router.get("/newFeaturedLeaderboard", (req, res) => res.status(200).json({msg: "here"}));

module.exports = router;