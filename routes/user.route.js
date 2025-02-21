const express = require("express");
const router = express.Router();
const { 
    getUserProfile, 
    updateUserProfile, 
    getUserByIds, 
    getEveryID, 
    updateOtherUser, 
    updateBadges, 
    saveQuestionnaireResponses 
} = require('../controllers/user.controller.js');
const auth = require('../middleware/auth.middleware.js');

// Get user profile
router.get('/', auth, getUserProfile);

// Update user profile (e.g., badges, lives)
router.put('/', auth, updateUserProfile);

// Get user(s) by ID
router.post('/', auth, getUserByIds);

// Get all user IDs
router.get('/id', auth, getEveryID);

// Update another user
router.put('/id', auth, updateOtherUser);

// Update user badges
router.put('/badge', auth, updateBadges);

// Save questionnaire responses (NEW ROUTE)
router.put('/questionnaire', auth, saveQuestionnaireResponses);

module.exports = router;
