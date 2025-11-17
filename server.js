require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin_key_change_me';
const JWT_SECRET = process.env.JWT_SECRET || ADMIN_KEY; // fallback to ADMIN_KEY if JWT_SECRET not provided
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommer';

const Product = require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');

app.use(cors());
app.use(express.json());

// Serve frontend static files from project root so index.html and admin.html are available
app.use(express.static(path.join(__dirname)));

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
});

function verifyToken(req, res, next) {
    const auth = req.headers['authorization'] || '';
    if (auth && auth.startsWith('Bearer ')) {
        const token = auth.slice(7);
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            req.user = payload;
        } catch (e) {
            // invalid token
            req.user = null;
        }
    }
    return next();
}

function checkAdmin(req) {
    // Admin allowed if x-admin-key header matches, or JWT present and payload.isAdmin === true
    const key = (req.headers && req.headers['x-admin-key']) || '';
    if (key === ADMIN_KEY) return true;
    if (req.user && req.user.isAdmin) return true;
    return false;
}

// apply token verification for all requests so admin checks can use req.user
app.use(verifyToken);

// Health (API) endpoint
app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Ecommerce API running' });
});

// Products - public
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }).lean();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/products/:id', async (req, res) => {
    try {
        const p = await Product.findById(req.params.id).lean();
        if (!p) return res.status(404).json({ error: 'Product not found' });
        res.json(p);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Products - admin CRUD
app.post('/products', async (req, res) => {
    if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const { name, price, desc, stock, imageUrl } = req.body;
        const newP = await Product.create({ name, price, desc, stock, imageUrl });
        res.json(newP);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.put('/products/:id', async (req, res) => {
    if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.delete('/products/:id', async (req, res) => {
    if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Auth - register (simple)
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password, isAdmin } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already registered' });

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hash, isAdmin: !!isAdmin });
        res.json({ success: true, userId: user._id });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login -> returns JWT
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

        // sign token
        const payload = { userId: user._id, email: user.email, isAdmin: !!user.isAdmin };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
        res.json({ success: true, token, user: { id: user._id, email: user.email, name: user.name, isAdmin: !!user.isAdmin } });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Orders
app.post('/orders', async (req, res) => {
    try {
        const { customer, items, total } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items in order' });

        const order = await Order.create({ customer, items, total });

        // Decrease stock for each product if productId provided
        for (const it of items) {
            if (it.productId) {
                try {
                    await Product.findByIdAndUpdate(it.productId, { $inc: { stock: -(it.qty || 1) } });
                } catch (e) {
                    // ignore stock update errors
                }
            }
        }

        res.json({ success: true, orderId: order._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create order' });
    }
});

app.get('/orders', async (req, res) => {
    if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log('Backend ready and connected.');
});

// Fallback: serve index.html for any non-API route (enables SPA/static hosting)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/products') || req.path.startsWith('/orders') || req.path.startsWith('/auth')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});