const mongoose = require('mongoose');
const argon2 = require('argon2');

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
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    
    console.log("🔍 Hashing password before saving...");
    this.password = await argon2.hash(this.password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 2,
    });

    console.log("✅ Password hashed successfully:", this.password);
    next();
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
