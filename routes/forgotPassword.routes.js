const express = require('express');
const { forgotPassword, verifyCode, resetPassword } = require('../controllers/forgotPasswordController.js');
const auth = require('../middleware/auth.middleware.js');

const router = express.Router();

// Forgot Password Routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyCode);
router.post('/reset-password', resetPassword);

module.exports = router;