const express = require("express");
const router = express.Router();
const { getUserProfile, updateUserProfile, getUserByIds, getEveryID, updateOtherUser, updateBadges} = require('../controllers/user.controller.js');
const auth = require('../middleware/auth.middleware.js');

// Get user profile
router.get('/', auth, getUserProfile);

// Update user profile (e.g., badges, lives)
router.put('/', auth, updateUserProfile);

router.post('/', auth, getUserByIds);

router.get('/id', auth, getEveryID);

router.put('/id', auth, updateOtherUser);

router.put('/badge', auth, updateBadges);


module.exports = router;