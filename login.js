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
    alert('Login successful. Token saved. You can now use Admin UI.');
    window.location.href = '/admin.html';
  } catch (err) {
    alert('Login error: ' + err.message);
  }
});
