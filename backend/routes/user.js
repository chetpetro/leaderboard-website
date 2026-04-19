const express = require('express');
const { loginUser, signupUser, getUser, updateUserPoints, getUsers, signupUserDiscord, loginUserDiscord } = require('../controllers/userController');

const router = express.Router();

// Login
router.post('/login', loginUser);

// Login with discord
router.post('/login-discord', loginUserDiscord);

// Sign in 
router.post('/sign-up', signupUser);

// Sign in with Discord 
router.post('/sign-up-discord', signupUserDiscord);

// Get all users
router.get('/', getUsers)

// Get user info
router.get('/:id', getUser);

// Refresh user points if the calculation method changed
router.get('/:id/update-points', updateUserPoints);
router.post('/:id/update-points', updateUserPoints);


module.exports = router;