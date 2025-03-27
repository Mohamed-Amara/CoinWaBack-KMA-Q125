const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10)
    }
});

redisClient.on('error', err => console.error('Redis Client Error:'));

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis Cloud');
    } catch (err) {
        console.error('Redis Connection Failed');
    }
})();

module.exports = redisClient;
