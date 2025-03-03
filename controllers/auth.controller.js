const User = require('../models/user.model.js');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const nodemailer = require("nodemailer");
const argon2 = require('argon2');

// Function to generate a 6-digit verification code
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Function to send the verification email
const sendVerificationEmail = async (email, code) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'noreplycoinwa@gmail.com',
            pass: 'vpvu nsgc zttd raxm' // Replace this with a secure method (e.g., env variables)
        }
    });

    const mailOptions = {
        from: 'noreplycoinwa@gmail.com',
        to: email,
        subject: "Your Verification Code",
        text: `Your verification code is: ${code}. It expires in 10 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📩 Verification code sent to ${email}`);
    } catch (error) {
        console.error("❌ Email sending error:", error);
    }
};

// ✅ New Register Route (No temp storage)
exports.register = async (req, res) => {
    const { fullname, birthday, username, email, password } = req.body;
    const lowercasedEmail = email.toLowerCase();

    try {
        let user = await User.findOne({ email: lowercasedEmail });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        console.log("🔍 Generating verification code...");
        const verificationCode = generateVerificationCode();

        const newUser = new User({
            fullname,
            birthday,
            username,
            lowercasedEmail,
            password, // Auto-hashed in `pre('save')`
            verificationCode,
            verificationExpires: Date.now() + 10 * 60 * 1000 // 10-minute expiry
        });

        await newUser.save();

        await sendVerificationEmail(lowercasedEmail, verificationCode);

        res.json({ msg: "Verification code sent to your email." });

    } catch (err) {
        console.error("❌ Registration Error:", err.message);
        res.status(500).send('Server error');
    }
};


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

        // Get today's index (Monday = 0, Sunday = 6)
        let todayIndex = today.isoWeekday() - 1;
        if (todayIndex === -1) todayIndex = 6; // Adjust for Sunday being the last index

        let streakDays = user.streakDays || [false, false, false, false, false, false, false];

        if (todayIndex === 0 && !lastLogin.isSame(today, 'week')) {
            console.log('New week detected, resetting streakDays');
            streakDays = [false, false, false, false, false, false, false];
        }

        streakDays[todayIndex] = true;
        user.streakDays = streakDays;


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

// Verify email route handler
exports.verifyEmail = async (req, res) => {
    const { email, code } = req.body;
    const lowercaedEmail = email.toLowerCase();

    try {
        const user = await User.findOne({ email: lowercasedEmail });

        if (!user) return res.status(400).json({ msg: 'User not found.' });
        if (user.isVerified) return res.status(400).json({ msg: 'User is already verified.' });

        // Check verification code and expiration
        if (user.verificationCode !== code) {
            return res.status(400).json({ msg: 'Invalid verification code.' });
        }

        if (Date.now() > user.verificationExpires) {
            return res.status(400).json({ msg: 'Verification code expired. Please request a new one.' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationExpires = undefined;
        await user.save();

        const token = jwt.sign(
            { id: user._id, tokenVersion: user.tokenVersion },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            msg: 'Verification successful! You can now log in.',
            token,
        });

    } catch (err) {
        console.error('❌ Verification Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// Login route handler
exports.login = async (req, res) => {
    const { email, password } = req.body;
    const lowercasedEmail = email.toLowerCase();

    try {
        const user = await User.findOne({ email: lowercasedEmail });
        if (!user) {
            console.log("❌ User not found:", email);
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        console.log("✅ User found:", user.email);
        console.log("🔒 Stored Hash from DB:", user.password);
        console.log("🔑 Entered Password (trimmed):", password.trim());

        console.log("🔍 Verifying password with Argon2...");
        const isMatch = await argon2.verify(user.password, password.trim());
        console.log("🔍 Password Match:", isMatch);

        if (!isMatch) {
            console.log("❌ Incorrect password for:", user.email);
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const token = generateToken(user);
        res.status(200).json({ token });

    } catch (err) {
        console.error("❌ Login Error:", err.message);
        res.status(500).json({ msg: "Server error" });
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
  
  exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // 🚨 Remove password from req.body to prevent accidental updates
        if (req.body.password) {
            delete req.body.password;
            console.log("🚨 Attempt to modify password blocked!");
        }

        Object.assign(user, req.body);
        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};
