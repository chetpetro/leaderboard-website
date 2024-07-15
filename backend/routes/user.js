const express = require('express');
const { loginUser, singupUser, getUser, getUsers } = require('../controllers/userController');

const router = express.Router();

// Login
router.post('/login', loginUser);

// Sign in 
router.post('/sign-up', singupUser);

// Get all users
router.get('/', getUsers)

// Get user info
router.get('/:id', getUser);


module.exports = router;