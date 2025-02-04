const User = require('../models/user.model.js');

exports.getLeaderboard = async (req, res) => {
    try {
        const sort = { coins: -1 };
        const projection = { coins: 1, username: 1, followers: 1, following: 1, profilepic: 1};
        const users = await User.find().sort(sort).limit(10).select(projection);
        res.status(200).json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getPosition = async (req, res) => {
    try {
        const sort = { coins: -1 };
        const projection = { coins: 1, username: 1};
        const user = await User.findById(req.user.id).select({coins: 1, username: 1});
        const users = await User.find().sort(sort).select(projection);

        const position = users.findIndex(u => u._id.toString() === user._id.toString()) + 1;

        res.status(200).json(position);


    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

exports.getLeaderboardFriends = async (req, res) => {
    try {
        const sort = { coins: -1 };
        const projection = { coins: 1, username: 1, followers: 1, following: 1, profilepic: 1};
        const userIds = (req.user.following.followingAccounts);
        if (!Array.isArray(userIds)) {
            return res.status(400).json({ error: 'Invalid follower accounts' });
        }
        userIds.push(req.user.id);
        const users = await User.find({ _id: { $in: userIds } }).sort(sort).limit(10).select(projection);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPositionFriends = async (req, res) => {
    try {
        const sort = { coins: -1 };
        const projection = { coins: 1, username: 1};
        const user = await User.findById(req.user.id).select({coins: 1, username: 1});
        const userIds = req.user.following.followingAccounts;
        
        if (!Array.isArray(userIds)) {
            return res.status(400).json({ error: 'Invalid follower accounts' });
        }
        userIds.push(req.user.id);
        const users = await User.find({ _id: { $in: userIds } }).sort(sort).select(projection);

        const position = users.findIndex(u => u._id.toString() === user._id.toString()) + 1;

        res.status(200).json(position);


    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}