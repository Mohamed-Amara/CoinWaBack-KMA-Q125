const express = require('express');
const { register, verifyEmail, login, logout, updateStreak } = require('../controllers/auth.controller.js');
const auth = require('../middleware/auth.middleware.js');

const router = express.Router();

// Register (sends verification code)
router.post('/register', register);

// Verify Email (user submits 6-digit code)
router.post('/verify-email', verifyEmail);

// Login
router.post('/login', login);

// Logout (protected)
router.post('/logout', auth, logout);

// Update Streak (protected)
router.put('/streak', auth, updateStreak);

module.exports = router;