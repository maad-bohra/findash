const express = require('express');
const cors = require('cors');
const User = require('./models/user');
const Transaction = require('./models/transaction');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API 

// 1. SIGNUP
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already exists.' });

        await User.create({ username, email, password });
        res.json({ success: true, message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) {
            res.json({ success: true, message: 'Login successful', user: { email: user.email, username: user.username } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. GET TRANSACTIONS
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ _id: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. ADD TRANSACTION
app.post('/api/transactions', async (req, res) => {
    const { name, date, category, status, amount } = req.body;
    try {
        const transaction = await Transaction.create({ name, date, category, status, amount });
        res.json({ success: true, id: transaction._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 5. GET FINANCIAL SUMMARY
app.get('/api/summary', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        const income   = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
        const expenses = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const balance  = income - expenses;
        res.json({ balance, income, expenses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. DELETE TRANSACTION
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const deleted = await Transaction.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Transaction not found.' });
        res.json({ success: true, message: 'Transaction deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = app;