let currentCategory = '';
let currentQuery = '';

async function loadMeta() {
  const meta = await api('/auctions/meta');
  document.getElementById('commission-pct').textContent = meta.commissionPercent;
  const nav = document.getElementById('category-nav');
  meta.categories.forEach((cat) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = cat;
    a.dataset.cat = cat;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      currentCategory = cat;
      document.querySelectorAll('#category-nav a').forEach((x) => x.classList.remove('active'));
      a.classList.add('active');
      loadAuctions();
    });
    li.appendChild(a);
    nav.appendChild(li);
  });
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
    if (!auctions.length) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    auctions.forEach((a) => {
      const card = document.createElement('article');
      card.className = 'auction-card';
      card.onclick = () => (location.href = `/auction.html?id=${a.id}`);
      const seconds = Math.max(0, Math.floor((new Date(a.ends_at) - Date.now()) / 1000));
      const img = a.image_path
        ? `<img src="${a.image_path}" alt="" />`
        : a.listing_type === 'real_estate'
          ? '🏠'
          : '📦';
      card.innerHTML = `
        <div class="thumb">${a.image_path ? `<img src="${a.image_path}" alt="" />` : img}</div>
        <div class="body">
          <span class="badge ${a.listing_type === 'real_estate' ? 'estate' : ''}">${a.category}</span>
          <h3>${escapeHtml(a.title)}</h3>
          <p class="price">${formatMoney(a.current_bid || a.starting_bid, a.currency)} <small>current</small></p>
          <p class="price"><small>Floor: ${formatMoney(a.floor_price, a.currency)}</small></p>
          <span class="timer-badge ${seconds < 120 ? 'live' : ''}">⏱ ${formatTimer(seconds)}</span>
          ${a.seller_rating ? `<p class="seller-trust"><span class="stars">★ ${a.seller_rating}</span> (${a.seller_review_count || 0})</p>` : ''}
        </div>`;
      grid.appendChild(card);
    });
  } catch (e) {
    grid.innerHTML = `<p class="alert alert-error">${e.message}. Is the server running?</p>`;
  }
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  currentQuery = document.getElementById('search-input').value.trim();
  loadAuctions();
});

document.getElementById('sort-select').addEventListener('change', loadAuctions);

loadMeta().then(loadAuctions);
setInterval(loadAuctions, 15000);
