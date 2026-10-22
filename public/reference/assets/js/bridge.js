(function () {
  let parentApi;
  try { parentApi = window.top && window.top !== window ? window.top.__BINAOV_API_URL__ : undefined; } catch (_) { parentApi = undefined; }
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiBase = parentApi || (isLocal ? 'http://localhost:4000/api' : 'https://chung-suc-be.onrender.com/api');

  const zaloContact = 'https://zalo.me/0995438093';

  const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);

  const syncAuthHeader = () => {
    const slot = document.querySelector('.account-slot');
    if (!slot) return;
    const token = localStorage.getItem('token');
    let isAdmin = false;
    try { isAdmin = token ? JSON.parse(atob(token.split('.')[1])).role === 'ADMIN' : false; } catch (_) {}
    const loggedIn = Boolean(token);
    document.querySelectorAll('.topnav .navlinks a[href*="profile"]').forEach((link) => { link.hidden = !loggedIn; });
    if (loggedIn) {
      slot.innerHTML = `${isAdmin ? '<a class="auth-btn" href="/admin" target="_top">Trang quản trị</a>' : '<a class="auth-btn" href="/account" target="_top">Tài khoản</a>'}<button class="auth-btn pink" type="button" data-logout>Đăng xuất</button>`;
      slot.querySelector('[data-logout]')?.addEventListener('click', () => {
        localStorage.removeItem('token');
        if (window.top) window.top.location.reload();
        else window.location.reload();
      });
    }
  };

  const renderHomeProducts = async () => {
    const grids = document.querySelectorAll('.price-grid');
    if (!grids.length) return;
    try {
      const response = await fetch(`${apiBase}/products`);
      if (!response.ok) return;
      const json = await response.json();
      const products = Array.isArray(json.data) ? json.data : [];
      if (!products.length) {
        grids.forEach((grid) => {
          grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 36px 16px; text-align: center; color: var(--muted); font-weight: 700;">Hiện tại chưa có sản phẩm nào đang mở bán.</div>';
        });
        return;
      }
      const html = products.map((product) => {
        const isClone = (product.name || '').toLowerCase().includes('clone');
        const tag = isClone ? 'Acc clone' : 'Chung sức';
        const priceVnd = new Intl.NumberFormat('vi-VN').format(product.price) + ' Xu';
        const resellerVnd = product.resellerPrice != null ? new Intl.NumberFormat('vi-VN').format(product.resellerPrice) + ' Xu' : null;
        const stockText = product.stock != null ? (product.stock > 0 ? `${product.stock} tài khoản` : 'Hết hàng') : 'Còn hàng';
        return `
          <article class="price-card">
            <span class="tag">${tag}</span>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description || '')}</p>
            <div class="price-row"><span>Giá thường</span><b>${priceVnd}</b></div>
            ${resellerVnd ? `<div class="price-row"><span>Giá CTV</span><b>${resellerVnd}</b></div>` : ''}
            <div class="price-row"><span>Số lượng</span><b>${stockText}</b></div>
            <strong>${priceVnd}</strong>
            <a class="btn btn-pink" href="/order?product=${encodeURIComponent(product.id)}" target="_top">${isClone ? 'Mua ngay' : 'Đặt ngay'}</a>
          </article>
        `;
      }).join('');
      grids.forEach((grid) => {
        grid.innerHTML = html;
      });
    } catch (_) {}
  };

  const wireLinks = () => {
    document.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const text = (link.textContent || '').toLowerCase();
      if (href.includes('deposit.php')) {
        link.href = '/topup';
        link.target = '_top';
      } else if (href.includes('order.php')) {
        link.href = '/order';
        link.target = '_top';
      } else if (href.includes('profile.php') || href.includes('history.php')) {
        link.href = '/account';
        link.target = '_top';
      } else if (href.includes('zalo.me') || text.includes('zalo')) {
        link.target = '_blank';
        link.rel = 'noopener';
        link.href = zaloContact;
      }
    });
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

  const showError = (form, message) => {
    let box = form.querySelector('.err');
    if (!box) {
      box = document.createElement('div');
      box.className = 'err';
      form.prepend(box);
    }
    box.textContent = message;
  };

  const renderHomeLeaderboard = async () => {
    const container = document.querySelector('.home-leaderboard-box .leaderboard-items');
    if (!container) return;
    try {
      const response = await fetch(`${apiBase}/leaderboard`);
      if (!response.ok) {
        container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:8px 0;">Chưa có lượt nạp nào. Hãy nạp tiền để vinh danh Top 1!</div>';
        return;
      }
      const json = await response.json();
      const list = Array.isArray(json.data) ? json.data : [];
      if (!list.length) {
        container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:8px 0;">Chưa có lượt nạp nào. Hãy nạp tiền để vinh danh Top 1!</div>';
        return;
      }
      const html = list.slice(0, 3).map((item, idx) => {
        const rankColor = idx === 0 ? '#f59e0b' : idx === 1 ? '#64748b' : '#ea580c';
        const rankBadge = idx === 0 ? '👑 #1' : idx === 1 ? '🥈 #2' : '🥉 #3';
        const amountVnd = new Intl.NumberFormat('vi-VN').format(item.totalDeposited) + ' Xu';
        const bg = idx === 0 ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : idx === 1 ? '#f8fafc' : '#fff7ed';
        const border = idx === 0 ? '#fde68a' : idx === 1 ? '#e2e8f0' : '#fed7aa';
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:12px;background:${bg};margin-bottom:6px;border:1px solid ${border};">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-weight:900;font-size:13px;color:${rankColor};">${rankBadge}</span>
              <strong style="font-size:13px;color:#0f172a;">${escapeHtml(item.username)}</strong>
            </div>
            <strong style="color:#0369a1;font-size:13px;font-weight:800;">${amountVnd}</strong>
          </div>
        `;
      }).join('');
      container.innerHTML = html;
    } catch (_) {
      container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:8px 0;">Chưa có lượt nạp nào. Hãy nạp tiền để vinh danh Top 1!</div>';
    }
  };

  syncAuthHeader();
  renderHomeProducts();
  renderHomeLeaderboard();
  wireLinks();

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    if (href.startsWith('/order') || href.startsWith('/topup') || href.startsWith('/account') || href.startsWith('/admin') || href.startsWith('/login') || href.startsWith('/register') || href.startsWith('/leaderboard')) {
      event.preventDefault();
      if (window.top) window.top.location.href = href;
      else window.location.href = href;
    }
  });

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
      const payload = { username: username.value, password: password.value };
      const response = await fetch(`${apiBase}/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const raw = await response.text();
      let result = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch (_) { result = {}; }
      if (!response.ok) throw new Error(result.message || 'Không thể đăng nhập');
      localStorage.setItem('token', result.data.token);
      if (window.top) {
        window.top.location.href = result.data.user?.role === 'ADMIN' ? '/admin' : '/account';
      } else {
        window.location.href = result.data.user?.role === 'ADMIN' ? '/admin' : '/account';
      }
    } catch (error) {
      showError(form, error instanceof Error ? error.message : 'Không thể kết nối máy chủ');
      if (submit) { submit.disabled = false; submit.textContent = 'Thử lại'; }
    }
  });
})();
