const User = require('../models/user.model.js');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const nodemailer = require("nodemailer");
const argon2 = require('argon2');
const redisClient = require('../redisClient');
require('dotenv').config();

// Function to generate a 6-digit verification code
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Function to send the verification email
const sendVerificationEmail = async (email, code) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Verification Code",
        text: `Your verification code is: ${code}. It expires in 10 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("❌ Email sending error:", error);
    }
};

// ✅ New Register Route (No temp storage)
exports.register = async (req, res) => {
    const { fullname, birthday, username, email, password } = req.body;
    const lowercasedEmail = email.toLowerCase();

    try {
        let existingUser = await User.findOne({
            $or: [{ email: lowercasedEmail }, { username }]
        });

        if (existingUser) {
            if (!existingUser.isVerified) {
                await User.deleteOne({ _id: existingUser._id });
            } else if (!existingUser.hasCompletedQuestionnaire) {
                const token = jwt.sign(
                    { id: existingUser._id, tokenVersion: existingUser.tokenVersion },
                    process.env.JWT_SECRET,
                    { expiresIn: '30d' }
                );
                return res.status(200).json({
                    msg: "You are already verified. Please complete the questionnaire.",
                    token
                });
            } else {
                return res.status(400).json({ msg: "User already exists and is verified." });
            }
        }

        const verificationCode = generateVerificationCode();

        await redisClient.set(`verification:${lowercasedEmail}`, verificationCode, 'EX', 600);

        const newUser = new User({
            fullname,
            birthday,
            username,
            email: lowercasedEmail,
            password,
            isVerified: false,
            hasCompletedQuestionnaire: false
        });

        await newUser.save();
        await sendVerificationEmail(lowercasedEmail, verificationCode);

        return res.status(200).json({ msg: "Verification code sent to your email." });

    } catch (err) {
        console.error("Registration Error:", err.message);
        res.status(500).send('Server error');
    }
};

exports.updateStreak = async (req, res) => {
    try {

        const user = await User.findById(req.user.id).select('-password'); // Exclude password

        if (!user) {
            return res.status(404).json({ message: 'User not found' }); // Handle user not found
        }

        const today = moment().startOf('day');
        const yesterday = moment().subtract(1, 'days').startOf('day');
        const lastLogin = moment(user.lastlogin).startOf('day');;


        if (lastLogin.isSame(today, 'day')) {
            // console.log('User already logged in today');
        } else if (lastLogin.isSame(yesterday, 'day')) { // Check if the last login was yesterday
            user.loginStreak += 1; // Increment if consecutive logins
        } else {
            user.loginStreak = 1; // Reset streak to 1 if not consecutive
        }

        user.lastlogin = Date.now(); // Update last login time

        await user.save();

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
    const lowercasedEmail = email.toLowerCase();

    try {
        const storedCode = await redisClient.get(`verification:${lowercasedEmail}`);
        if (!storedCode) {
            return res.status(400).json({ msg: "Verification code expired or invalid." });
        }

        if (storedCode !== code) {
            return res.status(400).json({ msg: "Incorrect verification code." });
        }

        await redisClient.del(`verification:${lowercasedEmail}`); // Remove code from Redis

        const user = await User.findOneAndUpdate(
            { email: lowercasedEmail },
            { isVerified: true },
            { new: true }
        );

        // ✅ Generate a token immediately so user can complete questionnaire
        const token = jwt.sign(
            { id: user._id, tokenVersion: user.tokenVersion },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({ 
            msg: "Verification successful! Please complete the questionnaire.", 
            token
        });

    } catch (err) {
        console.error('Verification Error:', err.message);
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
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ msg: "Please verify your email before logging in." });
        }

        const isMatch = await argon2.verify(user.password, password.trim());
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, tokenVersion: user.tokenVersion },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        if (!user.hasCompletedQuestionnaire) {
            return res.status(200).json({
                msg: "Please complete the questionnaire before proceeding.",
                token
            });
        }

        res.status(200).json({ token });

    } catch (err) {
        console.error("Login Error:", err.message);
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

        // Remove password from req.body to prevent accidental updates
        if (req.body.password) {
            delete req.body.password;
        }

        Object.assign(user, req.body);
        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};
