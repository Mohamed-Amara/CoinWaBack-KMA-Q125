const express = require("express");
const router = express.Router();
const { getLeaderboard, getPosition, getLeaderboardFriends, getPositionFriends} = require('../controllers/leaderboard.controller.js');
const auth = require('../middleware/auth.middleware.js');

router.get('/', auth, getLeaderboard);
router.get('/position', auth, getPosition);
router.get('/friends', auth, getLeaderboardFriends);
router.get('/pfriends', auth, getPositionFriends);
module.exports = router;