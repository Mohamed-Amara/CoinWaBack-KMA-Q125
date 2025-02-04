const  { createClient } = require('redis');

const client = createClient({
    password: 'IUvfjLsowHln5l0earWNowyybtTl96yx',
    socket: {
        host: 'redis-11297.c89.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 11297 // Ensure the port is parsed as an integer
    } 
});

// Error handling
client.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

// Connect to Redis
(async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Error connecting to Redis:', err);
    }
})();

module.exports = { client };
