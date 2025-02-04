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
    const { badges, lives, coins, progress, nextLifeRegeneration, followers, following, profilepic} = req.body;

    // Construct the update object
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
    if (followers){
        if(followers.followerAmount !== undefined) update["followers.followerAmount"] = followers.followerAmount;
        if(followers.followerAccounts !== undefined) update["followers.followerAccounts"] = followers.followerAccounts;
    }
    if (following){
        if(following.followingAmount !== undefined) update["following.followingAmount"] = following.followingAmount;
        if(following.followingAccounts !== undefined) update["following.followingAccounts"] = following.followingAccounts;
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

cron.schedule('* * * * *', async () => {
    try {
        const users = await User.find({
            lives: { $lt: 4 },
            nextLifeRegeneration: { $lte: new Date() }
        });

        users.forEach(async (user) => {
            user.lives += 1;
            if (user.lives < 4) {
                user.nextLifeRegeneration = new Date(Date.now() + 30 * 1000); // Set next regeneration in 1 minute
            } else {
                user.nextLifeRegeneration = null; // No regeneration needed
            }
            user.lastLifeRegeneration = new Date(); // Update last regeneration time
            await user.save();
          
        });
    } catch (err) {
        console.error('Error in cron job:', err.message);
    }
});

exports.getUserByIds = async (req, res) => {
    try {
        const userIds = req.body.userIds;
        const users = await User.find({ _id: { $in: userIds } }, 'username fullname profilepic followers following'); // Fetch required fields only
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

exports.getEveryID = async (req, res) => {
    try {
        const users = await User.find({}, '_id'); // Fetch ID only
        const ids = users.map(User => User._id)
        res.status(200).json(ids);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

exports.updateOtherUser = async (req, res) => {

    const user = await User.findById(req.body._id).select('-password'); // Exclude password

    if (!user) {
        console.log('User not found');
        return res.status(404).json({ message: 'User not found' }); // Handle user not found
    }

    user.followers.followerAccounts.push(req.user.id);
    user.followers.followerAmount = user.followers.followerAccounts.length;

    await user.save();
    res.status(200).json({ message: 'Other User updated successfully', user });
}

exports.updateBadges = async (req, res) => {

    const user = await User.findById(req.user.id);

    if (!user) {
        console.log('User not found');
        return res.status(404).json({ message: 'User not found' }); // Handle user not found
    }

    if (!user.badges.includes(req.body.badge)){
        user.badges.push(req.body.badge);
    }
    await user.save();
    res.status(200).json({ message: 'Other User updated successfully', user });
}
