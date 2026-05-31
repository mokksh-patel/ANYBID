const user = getUser();
if (!getToken() || user?.role !== 'admin') {
  location.href = '/login.html';
}

async function load() {
  const stats = await api('/admin/stats');
  document.getElementById('stats').innerHTML = `
    <div class="pillar"><strong>${stats.users}</strong><span>Users</span></div>
    <div class="pillar"><strong>${stats.active_auctions}</strong><span>Live auctions</span></div>
    <div class="pillar"><strong>₹${Number(stats.commission_earned).toLocaleString()}</strong><span>Commission earned</span></div>`;

  const auctions = await api('/admin/auctions');
  document.getElementById('admin-list').innerHTML = `<table style="width:100%;background:#fff;border-radius:8px">
    <thead><tr><th>ID</th><th>Title</th><th>Seller</th><th>Status</th><th>Flag</th><th>Action</th></tr></thead>
    <tbody>${auctions
      .map(
        (a) => `<tr>
        <td>${a.id}</td>
        <td>${a.title}</td>
        <td>${a.seller_name}</td>
        <td>${a.status}${a.flagged ? ' 🚩' : ''}</td>
        <td>${a.flag_reason || '-'}</td>
        <td>
          ${!a.flagged ? `<button onclick="flagItem(${a.id})">Flag</button>` : `<button onclick="unflagItem(${a.id})">Unflag</button>`}
          <button onclick="removeItem(${a.id})">Remove</button>
        </td></tr>`
      )
      .join('')}</tbody></table>`;
}

window.flagItem = async (id) => {
  const reason = prompt('Reason for flag?') || 'Suspected fraud';
  await api(`/admin/flag/${id}`, { method: 'POST', body: JSON.stringify({ reason }) });
  load();
};
window.unflagItem = async (id) => {
  await api(`/admin/unflag/${id}`, { method: 'POST' });
  load();
};
window.removeItem = async (id) => {
  if (confirm('Cancel this listing?')) {
    await api(`/admin/auction/${id}`, { method: 'DELETE' });
    load();
  }
};

load().catch((e) => {
  document.getElementById('admin-list').innerHTML = `<div class="alert alert-error">${e.message}</div>`;
});
