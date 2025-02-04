const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoute = require('./routes/user.route.js');
const authRoute = require('./routes/auth.route.js');
const leaderRoute = require('./routes/leaderboard.route.js');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoute);
app.use('/api/leaderboard', leaderRoute); 
app.use('/api/auth', authRoute);

app.get('/', (req, res) => {
    res.send('Hello from Node API Server');
});

mongoose.connect("mongodb+srv://admin:CoinWa123@cluster0.w95iu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then(() => {
    console.log("Connected to database!");
    app.listen(3000, '0.0.0.0', () => {
        console.log("Server is running on port 3000");
    });
})
.catch((error) => {
    console.error("Connection failed!", error);
}); 