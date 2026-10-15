(function () {
  let parentApi;
  try { parentApi = window.top && window.top !== window ? window.top.__CHUNGSUCLIQI_API_URL__ : undefined; } catch (_) { parentApi = undefined; }
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiBase = parentApi || (isLocal ? 'http://localhost:4000/api' : 'https://chung-suc-be.onrender.com/api');

  const showError = (form, message) => {
    let box = form.querySelector('.err');
    if (!box) {
      box = document.createElement('div');
      box.className = 'err';
      form.prepend(box);
    }
    box.textContent = message;
  };

  const syncAuthHeader = () => {
    const slot = document.querySelector('.account-slot');
    if (!slot) return;
    const token = localStorage.getItem('token');
    let isAdmin = false;
    try { isAdmin = token ? JSON.parse(atob(token.split('.')[1])).role === 'ADMIN' : false; } catch (_) {}
    const loggedIn = Boolean(token);
    if (loggedIn) {
      slot.innerHTML = `${isAdmin ? '<a class="auth-btn" href="/admin">Trang quản trị</a>' : '<a class="auth-btn" href="/account">Tài khoản</a>'}<button class="auth-btn pink" type="button" data-logout>Đăng xuất</button>`;
      slot.querySelector('[data-logout]')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.reload();
      });
    }
  };

  syncAuthHeader();

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form');
    if (!form) return;
    const password = form.querySelector('[name="password"]');
    const email = form.querySelector('[name="email"]');
    if (!password || !email) return;

    event.preventDefault();
    const submit = form.querySelector('button[type="submit"], button:not(.eye)');
    if (submit) { submit.disabled = true; submit.textContent = 'Đang xử lý...'; }

    try {
      const isRegister = Boolean(form.querySelector('[name="username"]'));
      const payload = isRegister
        ? { username: form.querySelector('[name="username"]')?.value, email: email.value, phone: form.querySelector('[name="phone"]')?.value, password: password.value }
        : { email: email.value, password: password.value };
      const response = await fetch(`${apiBase}/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const raw = await response.text();
      let result = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch (_) { result = {}; }
      if (!response.ok) throw new Error(result.message || 'Không thể đăng nhập');
      localStorage.setItem('token', result.data.token);
      window.top.location.href = result.data.user?.role === 'ADMIN' ? '/admin' : '/account';
    } catch (error) {
      showError(form, error instanceof Error ? error.message : 'Không thể kết nối máy chủ');
      if (submit) { submit.disabled = false; submit.textContent = 'Thử lại'; }
    }
  });
})();
