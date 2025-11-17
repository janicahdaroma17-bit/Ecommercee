// Use relative API paths so the admin UI works when frontend and backend are served from the same origin
const API_BASE = '';

function getAdminKey() {
  return document.getElementById('admin-key').value.trim();
}

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  else {
    const key = getAdminKey();
    if (key) headers['x-admin-key'] = key;
  }
  return headers;
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

function createCard(product) {
  const col = document.createElement('div');
  col.className = 'col-md-4';
  col.innerHTML = `
    <div class="card h-100">
      <img src="${product.imageUrl || 'https://via.placeholder.com/400x280?text=No+image'}" class="card-img-top" style="height:200px;object-fit:cover;"/>
      <div class="card-body d-flex flex-column">
        <h5>${product.name}</h5>
        <p class="text-muted">${product.desc || ''}</p>
        <p class="fw-bold mt-auto">₱${(product.price||0).toFixed(2)}</p>
        <div class="mt-2 d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${product._id}">Edit</button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${product._id}">Delete</button>
        </div>
      </div>
    </div>
  `;
  return col;
}

async function render() {
  const list = document.getElementById('products-list');
  list.innerHTML = '';
  const prods = await fetchProducts();
  prods.forEach(p => list.appendChild(createCard(p)));

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm('Delete this product?')) return;
      const key = getAdminKey();
      const res = await fetch(API_BASE + '/products/' + id, { method: 'DELETE', headers: { 'x-admin-key': key } });
      if (res.ok) render(); else alert('Delete failed');
    });
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const p = prods.find(x => x._id === id);
      if (!p) return;
      const newName = prompt('Name', p.name);
      if (newName === null) return;
      const newPrice = prompt('Price', p.price);
      const payload = { name: newName, price: parseFloat(newPrice) || p.price };
      const res = await fetch('/products/' + id, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (res.ok) render(); else alert('Update failed');
    });
  });
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('p-name').value,
    price: parseFloat(document.getElementById('p-price').value) || 0,
    stock: parseInt(document.getElementById('p-stock').value) || 0,
    imageUrl: document.getElementById('p-image').value,
    desc: document.getElementById('p-desc').value,
  };
  const res = await fetch('/products', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
  if (res.ok) {
    document.getElementById('product-form').reset();
    render();
  } else {
    alert('Failed to create product (check admin key)');
  }
});

render();
