const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const cors    = require('cors');
const ImageKit = require('imagekit');
const User        = require('./models/user');
const Transaction = require('./models/transaction');
const Category    = require('./models/category');
const Account     = require('./models/account');
const { sign, verify } = require('./utils/jwt');
const RefreshToken = require('./models/refreshToken');
const { hashPassword, comparePassword } = require('./utils/password');

const app = express();


const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));


let _imagekit;
function getImageKit() {
    if (!_imagekit) {
        _imagekit = new ImageKit({
            publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        });
    }
    return _imagekit;
}

// JWT middleware 

function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
    try {
        req.user = verify(token);
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}


function requireAdmin(req, res, next) {
    requireAuth(req, res, async () => {
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        
        next();
    });
}


function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>"'`]/g, '');
}

//1. SIGNUP 
app.post('/api/signup', async (req, res) => {
    // Fix #15: sanitise inputs
    const username = sanitizeString(req.body.username);
    const email    = sanitizeString(req.body.email);
    const password = req.body.password;

    if (!username || !email || !password)
        return res.status(400).json({ success: false, message: 'All fields are required' });

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already exists.' });

        const userCount = await User.countDocuments();
        const isAdmin = userCount === 0;

        
        await User.create({ username, email, password: hashPassword(password), isAdmin });
        res.json({ success: true, message: 'User created successfully', isAdmin });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. LOGIN 
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, message: 'Email and password required' });

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        
        if (!user || !comparePassword(password, user.password)) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact an admin.' });
        }

        
        const accessToken = sign({
            userId:  user._id.toString(),
            email:   user.email,
            isAdmin: user.isAdmin,
        });

        // Issue refresh token (30 days)
        const REFRESH_DAYS = 30;
        const rawRefreshToken = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
        await RefreshToken.create({ userId: user._id, token: rawRefreshToken, expiresAt });

        res.cookie('refreshToken', rawRefreshToken, {
            httpOnly: true,
            secure:   process.env.NODE_ENV === 'production',
            sameSite: 'None',
            maxAge:   REFRESH_DAYS * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            message: 'Login successful',
            token: accessToken,
            user: {
                email:    user.email,
                username: user.username,
                avatar:   user.avatar   || null,
                currency: user.currency || 'INR',
                isAdmin:  user.isAdmin  || false,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. REFRESH TOKEN
app.post('/api/auth/refresh', async (req, res) => {
    const raw = req.cookies?.refreshToken;
    if (!raw) return res.status(401).json({ success: false, message: 'No refresh token' });

    try {
        const stored = await RefreshToken.findOne({ token: raw });
        if (!stored || stored.expiresAt < new Date()) {
            // Delete if expired
            if (stored) await RefreshToken.deleteOne({ _id: stored._id });
            return res.status(401).json({ success: false, message: 'Refresh token expired' });
        }

        const user = await User.findById(stored.userId);
        if (!user || !user.isActive)
            return res.status(401).json({ success: false, message: 'User not found or inactive' });

        const newAccessToken = sign({
            userId:  user._id.toString(),
            email:   user.email,
            isAdmin: user.isAdmin,
        });

        res.json({ success: true, token: newAccessToken });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. LOGOUT — delete refresh token from DB and clear cookie
app.post('/api/auth/logout', async (req, res) => {
    const raw = req.cookies?.refreshToken;
    if (raw) await RefreshToken.deleteOne({ token: raw }).catch(() => {});
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'None' });
    res.json({ success: true, message: 'Logged out' });
});

// 5. GET USER PROFILE 
app.get('/api/user/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. UPDATE PROFILE 
app.put('/api/user/profile', requireAuth, async (req, res) => {
    const username = sanitizeString(req.body.username);
    const avatar   = req.body.avatar;
    const currency = req.body.currency;

    try {
        if (username) {
            const taken = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user.userId } });
            if (taken) return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const update = {};
        if (username) update.username = username.toLowerCase().trim();
        if (avatar !== undefined) update.avatar = avatar;
        if (currency) update.currency = currency;

        const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({
            success: true,
            message: 'Profile updated',
            user: {
                email:    user.email,
                username: user.username,
                avatar:   user.avatar,
                currency: user.currency,
                isAdmin:  user.isAdmin,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

//  5. CHANGE PASSWORD (self) 
app.put('/api/user/password', requireAuth, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        if (!oldPassword || !newPassword)
            return res.status(400).json({ success: false, message: 'All fields are required' });

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        
        if (!comparePassword(oldPassword, user.password))
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        if (newPassword.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

        
        user.password = hashPassword(newPassword);
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6. IMAGEKIT AUTH
app.get('/api/imagekit/auth', requireAuth, (req, res) => {
    try {
        const authParams = getImageKit().getAuthenticationParameters();
        res.json(authParams);
    } catch (err) {
        res.status(500).json({ success: false, message: 'ImageKit auth failed' });
    }
});



// GET all users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// UPDATE any user's profile
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const { username, email, currency, isAdmin, isActive } = req.body;
        const update = {};
        if (username  !== undefined) update.username = sanitizeString(username).toLowerCase().trim();
        if (email     !== undefined) update.email    = sanitizeString(email).toLowerCase().trim();
        if (currency  !== undefined) update.currency = currency;
        if (isAdmin   !== undefined) update.isAdmin  = isAdmin;
        if (isActive  !== undefined) update.isActive = isActive;

        if (isAdmin === false) {
            const adminCount = await User.countDocuments({ isAdmin: true, _id: { $ne: req.params.id } });
            if (adminCount === 0)
                return res.status(400).json({ success: false, message: 'Cannot remove the last admin.' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Fix #11: also return updated isAdmin so frontend can update localStorage
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// RESET any user's password
app.put('/api/admin/users/:id/password', requireAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Fix #1: hash the reset password
        user.password = hashPassword(newPassword);
        await user.save();
        res.json({ success: true, message: `Password reset for ${user.email}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE a user
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ success: false, message: 'User not found' });
        if (target._id.toString() === req.user.userId)
            return res.status(400).json({ success: false, message: 'Cannot delete your own account via admin panel.' });

        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: `User ${target.email} deleted.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const total   = await User.countDocuments();
        const active  = await User.countDocuments({ isActive: true });
        const admins  = await User.countDocuments({ isAdmin: true });
        res.json({ success: true, stats: { total, active, admins, inactive: total - active } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin change own password
app.put('/api/admin/password', requireAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

        const admin = await User.findById(req.user.userId);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        // Fix #1: hash the new password
        admin.password = hashPassword(newPassword);
        await admin.save();
        res.json({ success: true, message: 'Admin password changed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



app.get('/api/transactions', requireAuth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.userId }).sort({ _id: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transactions', requireAuth, async (req, res) => {
    const { name, date, category, status, amount } = req.body;
    try {
        const categoryExists = await Category.findOne({ name: category });
        if (!categoryExists)
            return res.status(400).json({ error: `Category "${category}" does not exist.` });

        // Fix #6: attach userId; Fix #13: date is now a Date type
        const transaction = await Transaction.create({
            userId: req.user.userId,
            name: sanitizeString(name),
            date: new Date(date), // Fix #13: coerce to Date
            category,
            status,
            amount
        });
        res.json({ success: true, id: transaction._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/summary', requireAuth, async (req, res) => {
    try {
        // Fix #6: only summarise the logged-in user's transactions
        const transactions = await Transaction.find({ userId: req.user.userId });
        const income   = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
        const expenses = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const balance  = income - expenses;
        res.json({ balance, income, expenses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/transactions/:id', requireAuth, async (req, res) => {
    try {
        // Fix #6: only allow deleting own transactions
        const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
        if (!deleted) return res.status(404).json({ success: false, message: 'Transaction not found.' });
        res.json({ success: true, message: 'Transaction deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// CATEGORIES (auth required) 
app.get('/api/categories', requireAuth, async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

app.post('/api/categories', requireAuth, async (req, res) => {
    try {
        const { name, icon, color } = req.body;
        if (!name || !name.trim())
            return res.status(400).json({ error: 'Category name is required' });

        const exists = await Category.findOne({ name: name.trim() });
        if (exists)
            return res.status(400).json({ error: 'Category already exists' });

        const category = await Category.create({ name: sanitizeString(name.trim()), icon, color });
        res.json({ success: true, category });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create category' });
    }
});

app.delete('/api/categories/:id', requireAdmin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });

        const inUse = await Transaction.findOne({ category: category.name });
        if (inUse)
            return res.status(400).json({ error: `Cannot delete "${category.name}" — it is used by existing transactions.` });

        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// ACCOUNTS (scoped per user) 
app.get('/api/accounts', requireAuth, async (req, res) => {
    try {
        const accounts = await Account.find({ userId: req.user.userId }).sort({ createdAt: 1 });
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

app.post('/api/accounts', requireAuth, async (req, res) => {
    try {
        const { name, type, balance, icon, color, creditLimit, bankName, upiId } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
        const account = await Account.create({
            userId: req.user.userId,
            name: sanitizeString(name),
            type, balance: balance || 0, icon, color, creditLimit, bankName, upiId
        });
        res.json({ success: true, account });
    } catch (err) {
        res.status(400).json({ error: err.message || 'Failed to create account' });
    }
});

app.patch('/api/accounts/:id', requireAuth, async (req, res) => {
    try {
        const { balance, name, creditLimit, bankName, upiId } = req.body;
        const update = {};
        if (balance     !== undefined) update.balance     = balance;
        if (name        !== undefined) update.name        = sanitizeString(name);
        if (creditLimit !== undefined) update.creditLimit = creditLimit;
        if (bankName    !== undefined) update.bankName    = bankName;
        if (upiId       !== undefined) update.upiId       = upiId;
        // Fix #6: only update own accounts
        const account = await Account.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            update,
            { new: true }
        );
        if (!account) return res.status(404).json({ error: 'Account not found' });
        res.json({ success: true, account });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update account' });
    }
});

app.delete('/api/accounts/:id', requireAuth, async (req, res) => {
    try {
        const deleted = await Account.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
        if (!deleted) return res.status(404).json({ error: 'Account not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = app;