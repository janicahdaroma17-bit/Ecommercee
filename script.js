// --- Basic product data (20 Clothing Products) ---
const PEXELS_API_KEY = "adHh1zRX3MvKcweofofLoW3YkUjml4whDd64jIxUAKEqDPKjIkl7v0oc";
const productList = [
    { id: 1, name: "Classic Denim Jacket", price: 1299.00, desc: "Timeless blue denim jacket with a comfortable fit.", stock: 20 },
    { id: 2, name: "Cotton Crewneck T-Shirt", price: 399.00, desc: "Soft 100% cotton tee available in multiple colors.", stock: 60 },
    { id: 3, name: "Slim Fit Chinos", price: 899.00, desc: "Stylish slim-fit chinos perfect for casual or smart wear.", stock: 35 },
    { id: 4, name: "Hooded Sweatshirt", price: 749.00, desc: "Cozy fleece hoodie with adjustable drawstrings.", stock: 40 },
    { id: 5, name: "Leather Belt", price: 350.00, desc: "Genuine leather belt with a classic metal buckle.", stock: 50 },
    { id: 6, name: "Running Sneakers", price: 1899.00, desc: "Lightweight running shoes designed for comfort and performance.", stock: 25 },
    { id: 7, name: "Floral Summer Dress", price: 1099.00, desc: "Flowy floral print dress perfect for warm days.", stock: 18 },
    { id: 8, name: "Puffer Jacket", price: 2299.00, desc: "Warm, water-resistant jacket ideal for cold weather.", stock: 15 },
    { id: 9, name: "Men’s Polo Shirt", price: 599.00, desc: "Breathable cotton polo shirt with a modern fit.", stock: 40 },
    { id: 10, name: "Women's Blazer", price: 1599.00, desc: "Tailored blazer suitable for work or formal occasions.", stock: 22 },
    { id: 11, name: "Athletic Joggers", price: 799.00, desc: "Comfortable joggers made with moisture-wicking fabric.", stock: 30 },
    { id: 12, name: "Wool Scarf", price: 499.00, desc: "Soft and warm wool scarf available in various patterns.", stock: 45 },
    { id: 13, name: "Baseball Cap", price: 299.00, desc: "Adjustable cap with embroidered logo.", stock: 55 },
    { id: 14, name: "Denim Jeans", price: 999.00, desc: "Classic straight-cut jeans with durable stitching.", stock: 38 },
    { id: 15, name: "Formal Dress Shoes", price: 2199.00, desc: "Elegant leather shoes perfect for formal occasions.", stock: 12 },
    { id: 16, name: "Casual Shorts", price: 549.00, desc: "Lightweight shorts for everyday summer wear.", stock: 33 },
    { id: 17, name: "Wool Cardigan", price: 899.00, desc: "Button-up wool cardigan with a soft, cozy feel.", stock: 20 },
    { id: 18, name: "Raincoat", price: 1299.00, desc: "Waterproof raincoat with hood and breathable lining.", stock: 17 },
    { id: 19, name: "Graphic Tee", price: 450.00, desc: "Trendy graphic t-shirt with unique printed design.", stock: 48 },
    { id: 20, name: "Leather Handbag", price: 1899.00, desc: "Premium leather handbag with spacious compartments.", stock: 10 }
];


// --- DOM Elements --- 
const productListEl = document.getElementById('product-list');
const cartListEl = document.getElementById('cart-list');
const cartCountEl = document.getElementById('cart-count');
const totalEl = document.getElementById('total');
const checkoutForm = document.getElementById('checkout-form');
const confirmCheckoutBtn = document.getElementById('confirm-checkout');
const clearCartBtn = document.getElementById('clear-cart');

// Initialize cart from localStorage or as an empty array (use unified key 'jandl_cart')
let cart = JSON.parse(localStorage.getItem('jandl_cart')) || [];

const imageCache = {}; // simple in-memory cache for fetched images

async function fetchProductImage(query) {
    if (!query) return null;
    if (imageCache[query]) return imageCache[query];

    const apiUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " clothes")}&per_page=1`;
    try {
        const res = await fetch(apiUrl, {
            headers: { Authorization: PEXELS_API_KEY }
        });
        const data = await res.json();
        const url = data?.photos?.[0]?.src?.medium || null;

        const fallback = "data:image/svg+xml;utf8," +
            "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='280'>" +
            "<rect width='100%' height='100%' fill='%23001f40'/>" +
            "<text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='%23a8f6ff' font-family='Inter,Arial' font-size='18'>Image not found</text>" +
            "</svg>";

        const finalUrl = url || fallback;
        imageCache[query] = finalUrl;
        return finalUrl;
    } catch (err) {
        console.error("Error fetching image for", query, err);
        const fallback = "data:image/svg+xml;utf8," +
            "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='280'>" +
            "<rect width='100%' height='100%' fill='%23001f40'/>" +
            "<text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='%23a8f6ff' font-family='Inter,Arial' font-size='18'>Image not found</text>" +
            "</svg>";
        imageCache[query] = fallback;
        return fallback;
    }
}


// --- Cart Persistence and Rendering ---

function saveCart() {
    localStorage.setItem('jandl_cart', JSON.stringify(cart));
}

async function renderProducts() {
    productListEl.innerHTML = ''; // Clear existing content

    // Try to fetch products from backend; fallback to local productList
    let productsToRender = productList;
    try {
        // Use relative API path so frontend works on Render (same origin)
        const res = await fetch('/products');
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                // Map DB products to the local product structure expected by the frontend
                productsToRender = data.map((p, idx) => ({
                    id: idx + 1,
                    name: p.name,
                    price: p.price,
                    desc: p.desc,
                    stock: p.stock,
                    imageUrl: p.imageUrl,
                    dbId: p._id
                }));
            }
        }
    } catch (e) {
        // ignore network errors and use local productList
    }

    for (const prod of productsToRender){
        const imageUrl = prod.imageUrl || await fetchProductImage(prod.name); // Prefer DB image if present

        const col = document.createElement('div');
        col.className = 'col';

        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body d-flex flex-column">
                <img src="${imageUrl}" class="card-img-top" alt="${prod.name}" style="height: 280px; object-fit: cover;">
                    <h5 class="card-title">${prod.name}</h5>
                    <p class="card-text text-secondary">${prod.desc}</p>
                    <p class="card-text fw-bold mt-auto fs-4">₱${prod.price.toFixed(2)}</p>
                    <button class="btn btn-primary mt-3 btn-add-to-cart" data-id="${prod.id}">Add to Cart</button>
                </div>
            </div>
        `;
        productListEl.appendChild(col);
    }

    // Attach event listeners to all "Add to Cart" buttons
    document.querySelectorAll('.btn-add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            addToCart(id);
        });
    });
}
renderProducts()

function addToCart(id) {
    const prod = productList.find(p => p.id === id);
    const item = cart.find(i => i.id === id);

    if (item) {
        // Item is already in cart, increase quantity
        item.qty += 1;
    } else {
        // Item is not in cart, add new item object
        if (prod) {
            cart.push({ id: prod.id, name: prod.name, price: prod.price, qty: 1 });
        }
    }

    saveCart();
    renderCart();
}

function updateCart(id, delta) {
    const item = cart.find(i => i.id === id);
    
    if (item) {
        item.qty += delta;
        
        // Remove item if quantity drops to 0 or below
        if (item.qty <= 0) {
            removeFromCart(id);
            return;
        }

        saveCart();
        renderCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
}

function renderCart() {
    cartListEl.innerHTML = ''; // Clear existing cart
    let total = 0;

    if (cart.length === 0) {
        cartListEl.innerHTML = '<li class="list-group-item text-center text-muted">Your cart is empty.</li>';
        // Only try to hide checkout container if it exists (on checkout.html)
        const checkoutContainer = document.getElementById('checkout-container');
        if (checkoutContainer) checkoutContainer.style.display = 'none';
    } else {
        // Only try to show checkout container if it exists (on checkout.html)
        const checkoutContainer = document.getElementById('checkout-container');
        if (checkoutContainer) checkoutContainer.style.display = 'block';

        cart.forEach(item => {
            total += item.price * item.qty;

            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            li.innerHTML = `
                <span class="text-truncate" style="max-width: 50%;">${item.name} <strong class="text-muted">(x${item.qty})</strong></span>
                <div class="d-flex align-items-center">
                    <div class="btn-group btn-group-sm me-3" role="group" aria-label="Quantity controls">
                        <button type="button" class="btn btn-outline-secondary btn-update-cart" data-action="decrease" data-id="${item.id}">-</button>
                        <button type="button" class="btn btn-outline-secondary disabled">${item.qty}</button>
                        <button type="button" class="btn btn-outline-secondary btn-update-cart" data-action="increase" data-id="${item.id}">+</button>
                    </div>
                    
                    <span class="fw-bold me-3">₱${(item.price * item.qty).toFixed(2)}</span>

                    <button type="button" class="btn btn-danger btn-sm btn-remove-item" data-id="${item.id}" aria-label="Remove button">❌</button>
                </div>
            `;
            cartListEl.appendChild(li);
        });
    }

    // Update totals and counts
    totalEl.innerText = total.toFixed(2);
    cartCountEl.innerText = cart.reduce((sum, item) => sum + item.qty, 0); // Total items in cart
    const cartTotalItemsEl = document.getElementById('cart-total-items');
    if (cartTotalItemsEl) cartTotalItemsEl.innerText = cart.length; // Number of unique items

    // Attach cart button listeners (must be done after rendering)
    document.querySelectorAll('.btn-update-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const action = e.currentTarget.dataset.action;
            const delta = action === 'increase' ? 1 : -1;
            updateCart(id, delta);
        });
    });

    document.querySelectorAll('.btn-remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            removeFromCart(id);
        });
    });
}

// --- Checkout Logic ---

if (confirmCheckoutBtn) {
    confirmCheckoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Form validation
    const name = document.getElementById('customer-name')?.value.trim();
    const email = document.getElementById('customer-email')?.value.trim();
    const address = document.getElementById('customer-address')?.value.trim();

    if (!name || !email || !address) {
        alert('Please fill out all checkout fields.');
        return;
    }

    if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
    }

    const total = parseFloat(totalEl.innerText);


    // Map cart items to include productId (MongoDB ObjectId from dbId)
    const itemsWithProductId = cart.map(item => {
        // Try to find the product in productList with dbId
        let product = null;
        if (Array.isArray(productList)) {
            product = productList.find(p => (p.id === item.id || p._id === item.id || p.dbId === item.id));
        }
        return {
            productId: product?.dbId || product?._id || undefined,
            name: item.name,
            price: item.price,
            qty: item.qty
        };
    });

    const order = {
        customer: { name, email, address },
        items: itemsWithProductId,
        total: total,
    };

    // POST to backend /orders endpoint
    try {
        const res = await fetch('/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(order),
        });

        if (!res.ok) {
            throw new Error('Server error during checkout.');
        }

        const data = await res.json();
        
        // Success
        alert(`✅ Order placed! Order ID: ${data.orderId}`);
        
        // Clear cart and form
        cart = [];
        saveCart();
        renderCart();
        if (checkoutForm) checkoutForm.reset();

    } catch (err) {
        // Alert on error when placing order
        alert('❌ Error placing order: ' + err.message);
    }
    });
}

// --- Clear Cart Button ---
if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
        if (confirm('Clear all items from cart?')) {
            cart = [];
            saveCart();
            renderCart();
        }
    });
}

// --- Initialization ---
renderProducts();
renderCart();