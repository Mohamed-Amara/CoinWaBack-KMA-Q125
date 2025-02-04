const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const initializeIncorrectQuestions = () => Array.from({ length: 9 }, () => []);

const UserSchema = mongoose.Schema(
    {
        fullname:{
            type: String,
            required: true
        },
        birthday:{
            type: Date,
            required: true
        },
        username: {
            type: String,
            required: [true, 'Please enter user name'],
            unique: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        coins: {
            type: Number,
            default: 0
        },
        lives: {
            type: Number,
            default: 4
        },
        badges: [{ type: String }],
        progress: {
            currentLevel: { type: Number, default: 1 },
            sublevel: {type: Number, default: 1},
            incorrectQuestions: {
                type: [[Number]],
                default: initializeIncorrectQuestions
            }
        },
        followers: {
            followerAmount: {type: Number, default: 0},
            followerAccounts: [String]
        },
        following: {
            followingAmount: {type: Number, default: 0},
            followingAccounts: [String]
        },
        profilepic: {
            type: String,
            default: "assets/defaultguy.png"
        },
        lastLifeRegeneration:{
            type: Date,
            default: Date.now
        },
        nextLifeRegeneration:{
            type: Date,
            default: function(){
                return new Date(Date.now() + 60 *1000);
            }
        },
        lastlogin: {
            type: Date,
            default: Date.now
        },
        loginStreak: {
            type: Number,
            default: 0
        },
        tokenVersion: { type: Number, default: 0 } 
    },
    {
        timestamps: true
    }
);

// Password hashing before saving the user
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
