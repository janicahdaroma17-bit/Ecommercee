document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    // store token
    localStorage.setItem('auth_token', data.token);
    // also store the returned user object so the client can check role
    if (data.user) localStorage.setItem('auth_user', JSON.stringify(data.user));
    alert('Login successful. Token saved.');
    // Redirect based on role: admins -> admin dashboard, users -> storefront
    if (data.user && data.user.isAdmin) {
      window.location.href = '/admin.html';
    } else {
      window.location.href = '/index.html';
    }
  } catch (err) {
    alert('Login error: ' + err.message);
  }
});
