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

// const mailOptions = {
//     from: 'spotifyamara05@gmail.com',
//     to: email,
//     subject: 'Password Reset Code',
//     text: `Your password reset code is: ${code}`
// }

// Forgot Password: Send Verification Code
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    console.log("connected");

    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = crypto.randomInt(100000, 999999).toString();
    resetTokens[email] = code;

    await transporter.sendMail({
        from: 'coinwa0355@gmail.com',
        to: email,
        subject: `CoinWa Password Reset Code: ${code}`,
        text: `Your password reset code is: ${code}`
    });

    res.json({ message: 'Verification code sent' });
};

// Verify Reset Code
const verifyCode = (req, res) => {
    const { email, code } = req.body;

    if (resetTokens[email] === code) {
        res.json({ message: 'Code verified' });
    } else {
        res.status(400).json({ message: 'Invalid code' });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (resetTokens[email] !== code) return res.status(400).json({ message: 'Invalid code' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword; // Ensure password is hashed before saving
    await user.save();

    delete resetTokens[email]; // Remove the token after password reset

    res.json({ message: 'Password reset successful' });
};

module.exports = { forgotPassword, verifyCode, resetPassword };