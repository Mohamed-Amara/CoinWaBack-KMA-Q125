const User = require('../models/user.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');

exports.updateStreak = async (req, res) => {
    try {

        const user = await User.findById(req.user.id).select('-password'); // Exclude password

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' }); // Handle user not found
        }

        const today = moment().startOf('day');
        const yesterday = moment().subtract(1, 'days').startOf('day');
        const lastLogin = moment(user.lastlogin).startOf('day');;


        if (lastLogin.isSame(today, 'day')) {
            console.log('User already logged in today');
        } else if (lastLogin.isSame(yesterday, 'day')) { // Check if the last login was yesterday
            user.loginStreak += 1; // Increment if consecutive logins
            console.log('Streak incremented to', user.loginStreak);
        } else {
            user.loginStreak = 1; // Reset streak to 1 if not consecutive
            console.log('Streak reset to 1');
        }

        user.lastlogin = Date.now(); // Update last login time

        await user.save();

        console.log('Updated Last Login:', user.lastLogin);

        res.status(200).json({ message: 'Streak updated successfully', user });
    } catch (err) {
        console.error('Server error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

function generateToken(user) {
    return jwt.sign(
        { id: user._id, tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
}

exports.register = async (req, res) => {
    const { fullname, birthday, username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ fullname, birthday, username, email, password: password });
        await user.save();

        const token = generateToken(user);
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
  
      const token = generateToken(user);
      res.status(200).json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server error' });
    }
  };

  exports.logout = async (req, res) => {
    try {
      const userId = req.user.id;
      await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
      res.json({ status: 'success', message: 'Logout successful' });
    } catch (err) {
      console.error('Logout error:', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
