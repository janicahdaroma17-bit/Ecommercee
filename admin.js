function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

function displayUser() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  document.getElementById('user-display').textContent = 'Admin';
}

function logout() {
  localStorage.removeItem('auth_token');
  window.location.href = '/login.html';
}

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  event.target.classList.add('active');
  if (tab === 'orders') loadOrders();
}

function openModal() {
  document.getElementById('modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
  document.getElementById('product-form').reset();
}

async function fetchProducts() {
  try {
    const res = await fetch('/products');
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch products', e);
    return [];
  }
}

async function loadOrders() {
  try {
    const res = await fetch('/orders', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    const orders = await res.json();
    const list = document.getElementById('orders-list');
    if (orders.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No orders yet</p></div>';
      return;
    }
    list.innerHTML = '<table class="table table-dark table-striped"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th></tr></thead><tbody>' +
      orders.map(o => `<tr>
        <td>${o._id.slice(-6)}</td>
        <td>${o.customer.name}</td>
        <td>${o.items.length}</td>
        <td>₱${o.total.toFixed(2)}</td>
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      </tr>`).join('') + '</tbody></table>';
  } catch (e) {
    console.error('Load orders error', e);
    document.getElementById('orders-list').innerHTML = '<div class="empty-state"><p style="color:#dc2626;">❌ Failed to load orders</p></div>';
  }
}

async function renderProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';
  const prods = await fetchProducts();
  
  if (prods.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-state-icon">📦</div><p>No products yet. Add one to get started!</p></div>';
    return;
  }

  prods.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.imageUrl || 'https://via.placeholder.com/280x200?text=No+Image'}" class="product-image" alt="${p.name}"/>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc || 'No description'}</div>
        <div class="product-meta">
          <span>📦 Stock: ${p.stock}</span>
          <span class="product-price">₱${p.price.toFixed(2)}</span>
        </div>
        <div class="product-actions">
          <button class="edit-btn" onclick="editProduct('${p._id}', '${p.name}', ${p.price}, ${p.stock}, '${(p.desc || '').replace(/'/g, "\\'")}', '${(p.imageUrl || '').replace(/'/g, "\\'")}')" title="Edit">✏️ Edit</button>
          <button class="delete-btn" onclick="deleteProduct('${p._id}')" title="Delete">🗑️ Delete</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function saveProduct(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('p-name').value,
    price: parseFloat(document.getElementById('p-price').value) || 0,
    stock: parseInt(document.getElementById('p-stock').value) || 0,
    imageUrl: document.getElementById('p-image').value,
    desc: document.getElementById('p-desc').value,
  };

  try {
    const res = await fetch('/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create product');
    closeModal();
    renderProducts();
    alert('✅ Product created successfully!');
  } catch (e) {
    alert('❌ Error: ' + e.message);
  }
}

async function editProduct(id, name, price, stock, desc, imageUrl) {
  document.getElementById('p-name').value = name;
  document.getElementById('p-price').value = price;
  document.getElementById('p-stock').value = stock;
  document.getElementById('p-desc').value = desc;
  document.getElementById('p-image').value = imageUrl;
  
  const originalForm = document.getElementById('product-form').onsubmit;
  document.getElementById('product-form').onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('p-name').value,
      price: parseFloat(document.getElementById('p-price').value) || 0,
      stock: parseInt(document.getElementById('p-stock').value) || 0,
      imageUrl: document.getElementById('p-image').value,
      desc: document.getElementById('p-desc').value,
    };
    try {
      const res = await fetch('/products/' + id, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Update failed');
      closeModal();
      renderProducts();
      document.getElementById('product-form').onsubmit = originalForm;
      alert('✅ Product updated successfully!');
    } catch (e) {
      alert('❌ Error: ' + e.message);
    }
  };
  
  openModal();
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    const res = await fetch('/products/' + id, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Delete failed');
    renderProducts();
    alert('✅ Product deleted successfully!');
  } catch (e) {
    alert('❌ Error: ' + e.message);
  }
}

// Initialize
displayUser();
renderProducts();
