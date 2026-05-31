if (!getToken()) location.href = '/login.html';

const user = getUser();
document.getElementById('welcome').textContent = `Hi, ${user?.name || 'Bidder'}`;

document.getElementById('logout-btn').onclick = () => {
  setToken(null);
  setUser(null);
  location.href = '/';
};

async function showNotifications() {
  const items = await api('/notifications');
  document.getElementById('panel').innerHTML =
    items.length === 0
      ? '<p class="empty-state">No notifications yet.</p>'
      : `<ul style="list-style:none">${items
          .map(
            (n) => `<li class="auth-card" style="margin-bottom:0.5rem;${n.read_flag ? 'opacity:0.7' : ''}">
            <strong>${escapeHtml(n.title)}</strong><br><small>${escapeHtml(n.message || '')}</small>
            <br><small>${new Date(n.created_at).toLocaleString()}</small></li>`
          )
          .join('')}</ul>`;
  await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
}

async function showListings(type) {
  const all = await api('/auctions/mine');
  const filtered =
    type === 'selling'
      ? all.filter((a) => a.seller_id === user.id)
      : all.filter((a) => a.current_bidder_id === user.id);

  document.getElementById('panel').innerHTML = filtered.length
    ? `<div class="auction-grid">${filtered
        .map(
          (a) => `<article class="auction-card" onclick="location.href='/auction.html?id=${a.id}'">
          <div class="body"><h3>${escapeHtml(a.title)}</h3>
          <p>${formatMoney(a.current_bid || a.starting_bid, a.currency)} · ${a.status}</p></div></article>`
        )
        .join('')}</div>`
    : '<p class="empty-state">Nothing here yet.</p>';
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const name = tab.dataset.tab;
    if (name === 'notifications') showNotifications();
    else showListings(name);
  });
});

showNotifications();
