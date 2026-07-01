const GRADIENTS = ['g1','g2','g3','g4','g5','g6'];
function gradientFor(id) { return GRADIENTS[id % GRADIENTS.length]; }

let currentCategory = '';
let currentQuery = '';

function escapeHtml(s) {
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

async function loadMeta() {
  const meta = await api('/auctions/meta');
  document.getElementById('commission-pct').textContent = meta.commissionPercent;
  const nav = document.getElementById('category-nav');
  meta.categories.forEach((cat) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</a>`;
    li.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      currentCategory = cat;
      document.querySelectorAll('#category-nav a').forEach(x => x.classList.remove('active'));
      li.querySelector('a').classList.add('active');
      loadAuctions();
    });
    nav.appendChild(li);
  });

  // Notification badge
  const user = getUser();
  if (user) {
    document.getElementById('notif-btn').style.display = 'flex';
    loadNotifications();
  }
}

async function loadNotifications() {
  try {
    const items = await api('/notifications');
    const unread = items.filter(n => !n.read_flag);
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = unread.length ? 'block' : 'none';
    const list = document.getElementById('notif-list');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div style="padding:1rem;font-size:.82rem;color:var(--muted);text-align:center">No notifications yet</div>';
      return;
    }
    list.innerHTML = items.map(n => `
      <div class="notif-item ${n.read_flag ? '' : 'unread'}">
        <div>${escapeHtml(n.title)}</div>
        <div style="font-size:.78rem;color:var(--muted);margin-top:.15rem">${escapeHtml(n.message || '')}</div>
        <div class="notif-time">${new Date(n.created_at).toLocaleString()}</div>
      </div>`).join('');
  } catch {}
}

async function loadAuctions() {
  const grid = document.getElementById('auction-grid');
  const empty = document.getElementById('empty');
  const sort = document.getElementById('sort-select').value;
  const params = new URLSearchParams({ status: 'active', sort });
  if (currentCategory) params.set('category', currentCategory);
  if (currentQuery) params.set('q', currentQuery);

  try {
    const auctions = await api(`/auctions?${params}`);
    grid.innerHTML = '';
    if (!auctions.length) { empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    auctions.forEach(a => grid.appendChild(buildCard(a)));
  } catch (e) {
    grid.innerHTML = `<div class="alert alert-error" style="grid-column:1/-1">${escapeHtml(e.message)} — is the server running?</div>`;
  }
}

function buildCard(a) {
  const seconds = Math.max(0, Math.floor((new Date(a.ends_at) - Date.now()) / 1000));
  const ended = seconds <= 0;
  const urgent = !ended && seconds < 120;
  const reserveMet = Number(a.current_bid) >= Number(a.floor_price);

  let timerHtml;
  if (ended) {
    timerHtml = `<span class="thumb-timer ended">ENDED</span>`;
  } else {
    timerHtml = `<span class="thumb-timer ${urgent ? 'urgent' : ''}">⏱ ${formatTimer(seconds)}</span>`;
  }

  let thumbInner;
  if (a.image_path) {
    thumbInner = `<img src="${a.image_path}" alt="${escapeHtml(a.title)}" loading="lazy" />`;
  } else {
    const emoji = a.listing_type === 'real_estate' ? '🏠' : a.category === 'Electronics' ? '📱' : a.category === 'Fashion' ? '👗' : a.category === 'Handmade' ? '🎨' : a.category === 'Vehicles' ? '🚗' : '📦';
    thumbInner = `<div class="${gradientFor(a.id)}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3.5rem">${emoji}</div>`;
  }

  const article = document.createElement('article');
  article.className = 'auction-card';
  article.setAttribute('role', 'button');
  article.setAttribute('tabindex', '0');
  article.setAttribute('aria-label', `${a.title} — current bid ${formatMoney(a.current_bid || a.starting_bid, a.currency)}`);
  article.innerHTML = `
    <div class="thumb">
      ${thumbInner}
      <span class="thumb-badge">${escapeHtml(a.category)}</span>
      ${timerHtml}
    </div>
    <div class="body">
      <h3>${escapeHtml(a.title)}</h3>
      <div class="card-seller">
        <span style="font-weight:600;color:var(--text)">${escapeHtml(a.seller_name)}</span>
        ${a.seller_rating ? `<span class="stars">★ ${a.seller_rating}</span><span style="color:var(--muted)">(${a.seller_review_count || 0})</span>` : ''}
      </div>
      <div class="card-price-row">
        <div>
          <div class="card-price-label">Current bid</div>
          <div class="card-price">${formatMoney(a.current_bid || a.starting_bid, a.currency)}</div>
        </div>
        <span class="reserve-badge ${reserveMet ? 'reserve-met' : 'reserve-not'}">
          ${reserveMet ? 'Reserve met ✓' : 'Reserve not met'}
        </span>
      </div>
      <div class="card-meta">${a.bid_count} bids · tap to view</div>
    </div>`;

  article.onclick = () => location.href = `/auction.html?id=${a.id}`;
  article.onkeydown = (e) => { if (e.key === 'Enter') article.click(); };
  return article;
}

// ── Search ────────────────────────────────────────────────────────
document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  currentQuery = document.getElementById('search-input').value.trim();
  loadAuctions();
});
document.getElementById('sort-select').addEventListener('change', loadAuctions);

// ── Notifications ─────────────────────────────────────────────────
const notifBtn = document.getElementById('notif-btn');
const notifDropdown = document.getElementById('notif-dropdown');
const notifClose = document.getElementById('notif-close');
if (notifBtn) {
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = notifDropdown.style.display !== 'none';
    notifDropdown.style.display = open ? 'none' : 'block';
    if (!open) {
      loadNotifications();
      api('/notifications/read-all', { method: 'POST' }).catch(() => {});
      const dot = document.getElementById('notif-dot');
      if (dot) dot.style.display = 'none';
    }
  });
}
if (notifClose) notifClose.addEventListener('click', () => { notifDropdown.style.display = 'none'; });
document.addEventListener('click', (e) => {
  if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
    notifDropdown.style.display = 'none';
  }
});

loadMeta().then(loadAuctions);
setInterval(loadAuctions, 12000);
