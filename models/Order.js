const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    customer: {
        name: String,
        email: String,
        address: String,
    },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
            name: String,
            price: Number,
            qty: Number
        }
    ],
    total: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
