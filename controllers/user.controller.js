const cron = require("node-cron");
const User = require('../models/user.model.js');

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateUserProfile = async (req, res) => {
    const { badges, lives, coins, progress, nextLifeRegeneration, followers, following, profilepic } = req.body;
    const update = {};

    if (progress) {
        if (progress.sublevel !== undefined) update['progress.sublevel'] = progress.sublevel;
        if (progress.incorrectQuestions !== undefined) update['progress.incorrectQuestions'] = progress.incorrectQuestions;
        if (progress.currentLevel !== undefined) update['progress.currentLevel'] = progress.currentLevel;
    }
    if (nextLifeRegeneration !== undefined) update.nextLifeRegeneration = nextLifeRegeneration;
    if (badges !== undefined) update.badges = badges;
    if (lives !== undefined) update.lives = lives;
    if (coins !== undefined) update.coins = coins;
    if (profilepic !== undefined) update.profilepic = profilepic;
    if (followers) {
        if (followers.followerAmount !== undefined) update["followers.followerAmount"] = followers.followerAmount;
        if (followers.followerAccounts !== undefined) update["followers.followerAccounts"] = followers.followerAccounts;
    }
    if (following) {
        if (following.followingAmount !== undefined) update["following.followingAmount"] = following.followingAmount;
        if (following.followingAccounts !== undefined) update["following.followingAccounts"] = following.followingAccounts;
    }

    try {
        const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// CRON job to regenerate lives
cron.schedule('* * * * *', async () => {
    try {
        const users = await User.find({
            lives: { $lt: 4 },
            nextLifeRegeneration: { $lte: new Date() }
        });

        users.forEach(async (user) => {
            user.lives += 1;
            if (user.lives < 4) {
                user.nextLifeRegeneration = new Date(Date.now() + 30 * 1000); // Set next regeneration in 30 seconds
            } else {
                user.nextLifeRegeneration = null;
            }
            user.lastLifeRegeneration = new Date();
            await user.save();
        });
    } catch (err) {
        console.error('Error in cron job:', err.message);
    }
});

exports.getUserByIds = async (req, res) => {
    try {
        const userIds = req.body.userIds;
        const users = await User.find({ _id: { $in: userIds } }, 'username fullname profilepic followers following');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getEveryID = async (req, res) => {
    try {
        const users = await User.find({}, '_id');
        const ids = users.map(user => user._id);
        res.status(200).json(ids);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateOtherUser = async (req, res) => {
    const user = await User.findById(req.body._id).select('-password');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.followers.followerAccounts.push(req.user.id);
    user.followers.followerAmount = user.followers.followerAccounts.length;

    await user.save();
    res.status(200).json({ message: 'Other User updated successfully', user });
};

exports.updateBadges = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (!user.badges.includes(req.body.badge)) {
        user.badges.push(req.body.badge);
    }
    await user.save();
    res.status(200).json({ message: 'Badges updated successfully', user });
};

// Save questionnaire responses
exports.saveQuestionnaireResponses = async (req, res) => {
    try {
        const userId = req.user.id;
        const { responses } = req.body;  // Expecting { question1: "answer1", question2: "answer2", ... }

        // Validate that responses is an object
        if (!responses || typeof responses !== 'object') {
            return res.status(400).json({ msg: 'Invalid responses format. It should be an object.' });
        }

        // Check if question2 is an array and handle it
        if (responses.question2 && Array.isArray(responses.question2)) {
            responses.question2 = responses.question2[0];  // Or handle the array differently
        }

        // Find the user and update their questionnaire responses
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { questionnaireResponses: responses } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Respond with a success message
        res.status(200).json({ msg: 'Responses saved successfully', user });
    } catch (error) {
        console.error('Error saving questionnaire responses:', error);
        res.status(500).json({ msg: 'Server error', error });
    }
};


