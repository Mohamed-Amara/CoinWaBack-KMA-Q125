const express = require('express');
const { register, login, logout, updateStreak } = require('../controllers/auth.controller.js');
const auth = require('../middleware/auth.middleware.js');

const router = express.Router();

// Register
router.post('/register', register);

// Login
router.post('/login', login);

router.post('/logout', auth, logout);

router.put('/streak', auth, updateStreak);

module.exports = router;