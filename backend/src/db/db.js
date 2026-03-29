const mongoose = require('mongoose');
const User = require('../models/user');
const Transaction = require('../models/transaction');

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        
        const adminExists = await User.findOne({ email: 'admin@test.com' });
        if (!adminExists || !adminExists.username) {
            await User.deleteOne({ email: 'admin@test.com' });
            await User.create({
                username: 'admin',
                email:    'admin@test.com',
                password: 'maadbohra'
            });
            console.log('Default admin user created/fixed.');
        }

        

    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;