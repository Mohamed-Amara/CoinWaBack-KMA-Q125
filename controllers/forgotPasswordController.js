const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user.model');

const resetTokens = {}; // Temporary storage for verification codes

// Email Transporter Configuration (Replace with your credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'noreplycoinwa@gmail.com',
        pass: 'vpvu nsgc zttd raxm'
    }
});

// Forgot Password: Send Verification Code
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const lowercasedEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowercasedEmail });
    console.log("connected");

    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = crypto.randomInt(100000, 999999).toString();
    resetTokens[lowercasedEmail] = code;

    await transporter.sendMail({
        from: 'coinwa0355@gmail.com',
        to: lowercasedEmail,
        subject: `CoinWa Password Reset Code: ${code}`,
        text: `Your password reset code is: ${code}`
    });

    res.json({ message: 'Verification code sent' });
};

// Verify Reset Code
const verifyCode = (req, res) => {
    const { lowercasedEmail, code } = req.body;

    if (resetTokens[lowercasedEmail] === code) {
        res.json({ message: 'Code verified' });
    } else {
        res.status(400).json({ message: 'Invalid code' });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    const lowercasedEmail = email.toLowerCase();

    if (resetTokens[lowercasedEmail] !== code) return res.status(400).json({ message: 'Invalid code' });

    const user = await User.findOne({ email: lowerCasedEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword; // Ensure password is hashed before saving
    await user.save();

    delete resetTokens[lowercasedEmail]; // Remove the token after password reset

    res.json({ message: 'Password reset successful' });
};

module.exports = { forgotPassword, verifyCode, resetPassword };