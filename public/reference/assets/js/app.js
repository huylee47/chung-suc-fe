document.addEventListener('DOMContentLoaded', () => {
  const loader = document.querySelector('.loader');
  if (loader) setTimeout(() => loader.classList.add('hide'), 240);

  document.querySelectorAll('[data-copy]').forEach((el) => {
    el.addEventListener('click', async () => {
      const value = el.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(value);
        const old = el.textContent;
        el.textContent = 'Đã copy';
        setTimeout(() => { el.textContent = old; }, 1000);
      } catch (e) {}
    });
  });

  document.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-tab');
      const root = btn.closest('[data-tabs]') || document;
      root.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b === btn));
      root.querySelectorAll('[data-panel]').forEach((p) => {
        p.hidden = p.getAttribute('data-panel') !== name;
      });
    });
  });

  document.querySelectorAll('[data-amount]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = document.querySelector('[data-amount-target]');
      if (box) box.textContent = btn.getAttribute('data-amount');
      document.querySelectorAll('[data-amount]').forEach((b) => b.classList.toggle('on', b === btn));
      const amt = btn.getAttribute('data-amount-value') || '';
      document.querySelectorAll('[data-qr]').forEach((img) => {
        const base = img.getAttribute('data-qr') || img.src;
        img.src = amt ? base + '&amount=' + encodeURIComponent(amt) : base;
      });
    });
  });

  const form = document.querySelector('[data-order-form]');
  if (form) {
    const prices = JSON.parse(form.getAttribute('data-prices') || '{}');
    const discounts = JSON.parse(form.getAttribute('data-discounts') || '[]');
    const out = form.querySelector('[data-total]');
    const count = form.querySelector('[data-count]');
    const calc = () => {
      const id = form.querySelector('[name=product_id]')?.value;
      const raw = form.querySelector('[name=chung_suc_code]')?.value || '';
      const lines = raw.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
      const pre = form.querySelector('[name=mode]')?.value === 'preorder';
      const qty = pre ? 1 : lines.length;
      const unit = Number(prices[id] || 0);
      let total = unit * qty;
      const deal = discounts.find((d) => qty >= Number(d.min_qty));
      if (deal) {
        const off = deal.discount_type === 'percent' ? Math.round(total * Number(deal.discount_value) / 100) : Number(deal.discount_value);
        total = Math.max(0, total - off);
      }
      if (count) count.textContent = String(qty);
      if (out) out.textContent = new Intl.NumberFormat('vi-VN').format(total) + ' Xu';
    };
    form.addEventListener('input', calc);
    form.addEventListener('change', calc);
    calc();
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const visual = document.querySelector('.banner-card');
    const image = visual?.querySelector('img');
    if (visual && image) {
      visual.addEventListener('pointermove', (event) => {
        const rect = visual.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
        image.style.transform = `scale(1.06) translate(${x * 5}px, ${y * 4}px)`;
      });
      visual.addEventListener('pointerleave', () => { image.style.transform = ''; });
    }
  }
});
