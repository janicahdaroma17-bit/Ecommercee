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
}).then(async () => {
    console.log('✅ Connected to MongoDB');
    // Remove all products and insert new ones
    const newProducts = [
        {
            name: 'Minimalist White Sneakers',
            price: 2499,
            desc: 'Crisp, clean sneakers for everyday wear.',
            stock: 30,
            imageUrl: ''
        },
        {
            name: 'Classic Black Hoodie',
            price: 1599,
            desc: 'Soft fleece hoodie with a modern fit.',
            stock: 25,
            imageUrl: ''
        },
        {
            name: 'Slim Fit Blue Jeans',
            price: 1899,
            desc: 'Timeless blue jeans with a slim silhouette.',
            stock: 40,
            imageUrl: ''
        },
        {
            name: 'Olive Green Cargo Pants',
            price: 1399,
            desc: 'Functional cargo pants with multiple pockets.',
            stock: 20,
            imageUrl: ''
        },
        {
            name: 'Lightweight Windbreaker',
            price: 1799,
            desc: 'Water-resistant windbreaker for all seasons.',
            stock: 18,
            imageUrl: ''
        }
    ];
    await Product.deleteMany({});
    await Product.insertMany(newProducts);
    console.log('🌟 Reset products collection with new products.');
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
        // client may send either an email or a username in the `email` field (labelled 'Username' in UI)
        const { email: identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).json({ error: 'Email/username and password required' });
        // try to find user by email OR by username (stored in `name`)
        const user = await User.findOne({ $or: [{ email: identifier }, { name: identifier }] });
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

// Return current user info based on verified JWT
app.get('/auth/me', async (req, res) => {
    try {
        if (!req.user || !req.user.userId) return res.status(401).json({ error: 'Unauthorized' });
        const user = await User.findById(req.user.userId).select('-password').lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, isAdmin: !!user.isAdmin } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Orders
app.post('/orders', async (req, res) => {
    try {
        console.log('Incoming order payload:', req.body);
        const { customer, items, total } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items in order' });

        // Validate each item has a productId and that the product exists
        const invalidItems = [];
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (!it.productId) {
                invalidItems.push({ index: i, reason: 'missing productId', item: it });
                continue;
            }
            if (!mongoose.Types.ObjectId.isValid(it.productId)) {
                invalidItems.push({ index: i, reason: 'invalid productId format', item: it });
                continue;
            }
            const prod = await Product.findById(it.productId).lean();
            if (!prod) {
                invalidItems.push({ index: i, reason: 'product not found', productId: it.productId });
            }
        }

        if (invalidItems.length > 0) {
            console.error('Order validation failed:', invalidItems);
            return res.status(400).json({ error: 'Invalid order items', details: invalidItems });
        }

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
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Failed to create order', message: err.message });
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