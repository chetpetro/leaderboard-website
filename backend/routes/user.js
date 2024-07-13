const express = require('express');
const { loginUser, singupUser, getUser } = require('../controllers/userController');

const router = express.Router();

// Login
router.post('/login', loginUser);

// Sign in 
router.post('/sign-up', singupUser);

// Get user info
router.get('/:id', getUser);

module.exports = router;