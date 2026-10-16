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
    document.querySelectorAll('.topnav .navlinks a[href*="profile"]').forEach((link) => { link.hidden = !loggedIn; });
    if (loggedIn) {
      slot.innerHTML = `${isAdmin ? '<a class="auth-btn" href="/admin">Trang quản trị</a>' : '<a class="auth-btn" href="/account">Tài khoản</a>'}<button class="auth-btn pink" type="button" data-logout>Đăng xuất</button>`;
      slot.querySelector('[data-logout]')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.reload();
      });
    }
  };

  const removeField = (input) => {
    if (!input) return;
    const label = input.previousElementSibling;
    if (label?.tagName === 'LABEL') label.remove();
    input.remove();
  };
  document.querySelectorAll('form').forEach((form) => {
    const username = form.querySelector('[name="username"]');
    const email = form.querySelector('[name="email"]');
    if (username) {
      form.dataset.authMode = 'register';
      removeField(email);
      removeField(form.querySelector('[name="phone"]'));
      removeField(form.querySelector('[name="password2"]'));
      form.querySelector('[name="remember"]')?.closest('label')?.remove();
    } else if (email) {
      form.dataset.authMode = 'login';
      email.type = 'text';
      email.name = 'username';
      email.placeholder = 'Tên đăng nhập';
      email.autocomplete = 'username';
      if (email.previousElementSibling?.tagName === 'LABEL') email.previousElementSibling.textContent = 'Tên đăng nhập';
    }
  });

  syncAuthHeader();

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form');
    if (!form) return;
    const password = form.querySelector('[name="password"]');
    const username = form.querySelector('[name="username"]');
    if (!password || !username) return;

    event.preventDefault();
    const submit = form.querySelector('button[type="submit"], button:not(.eye)');
    if (submit) { submit.disabled = true; submit.textContent = 'Đang xử lý...'; }

    try {
      const isRegister = form.dataset.authMode === 'register';
      const payload = isRegister
        ? { username: username.value, password: password.value }
        : { username: username.value, password: password.value };
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
