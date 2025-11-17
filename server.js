require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin_key_change_me';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommer';

const Product = require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');

app.use(cors());
app.use(express.json());

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
});

function checkAdmin(req, res) {
    const key = req.headers['x-admin-key'] || '';
    return key === ADMIN_KEY;
}

// Health
app.get('/', (req, res) => {
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
        const { name, email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already registered' });
        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hash });
        res.json({ success: true, userId: user._id });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
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