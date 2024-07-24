const express = require('express');
const { loginUser, signupUser, getUser, getUsers, signupUserDiscord, loginUserDiscord } = require('../controllers/userController');

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


module.exports = router;