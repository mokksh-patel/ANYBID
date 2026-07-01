const user = getUser();
if (!getToken() || user?.role !== 'admin') location.href = '/login.html';

function escapeHtml(s) {
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

async function loadStats() {
  const s = await api('/admin/stats');
  document.getElementById('stats').innerHTML = `
    <div class="stat-card"><div class="stat-val">${s.users}</div><div class="stat-label">Total users</div></div>
    <div class="stat-card"><div class="stat-val">${s.active_auctions}</div><div class="stat-label">Live auctions</div></div>
    <div class="stat-card"><div class="stat-val">${s.sold_auctions}</div><div class="stat-label">Sold</div></div>
    <div class="stat-card"><div class="stat-val">₹${Number(s.commission_earned).toLocaleString('en-IN')}</div><div class="stat-label">Commission earned</div></div>`;
}

async function loadAuctions(flaggedOnly) {
  const url = flaggedOnly ? '/admin/auctions?flagged=1' : '/admin/auctions';
  const auctions = await api(url);
  if (!auctions.length) {
    document.getElementById('admin-panel').innerHTML = '<p class="empty-state">No auctions found.</p>';
    return;
  }
  document.getElementById('admin-panel').innerHTML = `
    <div style="overflow-x:auto">
      <table class="admin-table">
        <thead><tr>
          <th>ID</th><th>Title</th><th>Seller</th><th>Status</th><th>Flag</th><th>Actions</th>
        </tr></thead>
        <tbody>${auctions.map(a => `
          <tr>
            <td style="color:var(--muted)">#${a.id}</td>
            <td><a href="/auction.html?id=${a.id}" style="font-weight:600">${escapeHtml(a.title)}</a></td>
            <td>${escapeHtml(a.seller_name)}</td>
            <td><span style="font-size:.78rem;font-weight:600;color:${a.status==='active'?'var(--success)':a.status==='sold'?'var(--primary)':'var(--muted)'}">${a.status}</span></td>
            <td>${a.flagged ? `<span class="flag-badge">🚩 ${escapeHtml(a.flag_reason||'')}</span>` : '<span style="color:var(--muted);font-size:.78rem">—</span>'}</td>
            <td style="display:flex;gap:.4rem;flex-wrap:wrap">
              ${!a.flagged
                ? `<button class="btn btn-sm btn-danger" onclick="flagItem(${a.id})">Flag</button>`
                : `<button class="btn btn-sm btn-outline" style="color:var(--text);border-color:var(--border)" onclick="unflagItem(${a.id})">Unflag</button>`}
              <button class="btn btn-sm" style="background:#f4f4f5;color:var(--text)" onclick="removeItem(${a.id})">Remove</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function loadUsers() {
  const users = await api('/admin/users');
  document.getElementById('admin-panel').innerHTML = `
    <div style="overflow-x:auto">
      <table class="admin-table">
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>${users.map(u => `
          <tr>
            <td style="color:var(--muted)">#${u.id}</td>
            <td style="font-weight:600">${escapeHtml(u.name)}</td>
            <td style="color:var(--muted)">${escapeHtml(u.email)}</td>
            <td><span style="font-size:.78rem;font-weight:700;color:${u.role==='admin'?'var(--primary)':'var(--muted)'}">${u.role}</span></td>
            <td style="color:var(--muted);font-size:.78rem">${new Date(u.created_at).toLocaleDateString()}</td>
            <td>
              ${u.role !== 'admin'
                ? `<button class="btn btn-sm btn-dark" onclick="promoteUser(${u.id})">Make Admin</button>`
                : `<button class="btn btn-sm" style="background:#f4f4f5;color:var(--text)" onclick="demoteUser(${u.id})">Remove Admin</button>`}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

window.flagItem = async (id) => {
  const reason = prompt('Reason for flagging?') || 'Suspected fraud';
  await api(`/admin/flag/${id}`, { method: 'POST', body: JSON.stringify({ reason }) });
  showToast('Listing flagged.', 'success');
  loadAuctions(false);
};
window.unflagItem = async (id) => {
  await api(`/admin/unflag/${id}`, { method: 'POST' });
  showToast('Flag removed.', 'success');
  loadAuctions(false);
};
window.removeItem = async (id) => {
  if (!confirm('Cancel this listing? This cannot be undone.')) return;
  await api(`/admin/auction/${id}`, { method: 'DELETE' });
  showToast('Listing removed.', 'success');
  loadAuctions(false);
};
window.promoteUser = async (id) => {
  if (!confirm('Make this user an admin?')) return;
  await api(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role: 'admin' }) });
  showToast('User promoted to admin.', 'success');
  loadUsers();
};
window.demoteUser = async (id) => {
  if (!confirm('Remove admin role from this user?')) return;
  await api(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role: 'user' }) });
  showToast('Admin role removed.', 'success');
  loadUsers();
};

// Tabs
document.querySelectorAll('#admin-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#admin-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const name = tab.dataset.tab;
    if (name === 'auctions') loadAuctions(false);
    else if (name === 'flagged') loadAuctions(true);
    else if (name === 'users') loadUsers();
  });
});

loadStats();
loadAuctions(false);
