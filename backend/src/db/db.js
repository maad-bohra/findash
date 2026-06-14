const mongoose = require('mongoose');
const User = require('../models/user');
const Category = require('../models/category');
const { hashPassword } = require('../utils/password');

const MONGO_URI = (process.env.MONGO_URI || '').trim(); 
const DEFAULT_CATEGORIES = [
    { name: 'Food',          icon: '🍜', color: '#f5a623' },
    { name: 'Transport',     icon: '🚗', color: '#4f8ef7' },
    { name: 'Shopping',      icon: '🛒', color: '#a78bfa' },
    { name: 'Entertainment', icon: '🎬', color: '#fb7185' },
    { name: 'Health',        icon: '💊', color: '#3dd68c' },
    { name: 'Bills',         icon: '📋', color: '#f76f6f' },
    { name: 'Salary',        icon: '💰', color: '#34d399' },
    { name: 'Education',     icon: '🎓', color: '#60a5fa' },
];

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
                password: hashPassword('maadbohra'), 
                isAdmin:  true,                      
            });
            console.log('Default admin user created.');
        }

        // Seed default categories if none exist
        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            await Category.insertMany(DEFAULT_CATEGORIES);
            console.log('Default categories seeded.');
        }
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;