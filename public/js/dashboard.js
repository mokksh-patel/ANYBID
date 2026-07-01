if (!getToken()) location.href = '/login.html';

const user = getUser();

// Sidebar setup
const sidebarName  = document.getElementById('sidebar-name');
const sidebarEmail = document.getElementById('sidebar-email');
const avatarEl     = document.getElementById('avatar');
if (sidebarName)  sidebarName.textContent  = user?.name  || 'My Account';
if (sidebarEmail) sidebarEmail.textContent = user?.email || '';
if (avatarEl && user?.name) avatarEl.textContent = user.name.charAt(0).toUpperCase();

document.getElementById('logout-btn').onclick = () => {
  setToken(null); setUser(null); location.href = '/';
};

function escapeHtml(s) {
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

// ── Overview ──────────────────────────────────────────────────────
async function showOverview() {
  const [all, payments, notifs] = await Promise.all([
    api('/auctions/mine'),
    api('/payments/mine'),
    api('/notifications'),
  ]);

  const myListings  = all.filter(a => a.seller_id === user.id);
  const myBids      = all.filter(a => a.current_bidder_id === user.id || a.winner_id === user.id);
  const won         = all.filter(a => a.winner_id === user.id && a.status === 'sold');
  const totalSpent  = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const unread      = notifs.filter(n => !n.read_flag);

  document.getElementById('panel').innerHTML = `
    <div class="dash-section-title">📊 Overview</div>
    <div class="dash-stats">
      <div class="stat-card"><div class="stat-val">${myListings.length}</div><div class="stat-label">My Listings</div></div>
      <div class="stat-card"><div class="stat-val">${myBids.length}</div><div class="stat-label">Auctions Bid</div></div>
      <div class="stat-card"><div class="stat-val">${won.length}</div><div class="stat-label">Items Won</div></div>
      <div class="stat-card"><div class="stat-val">${formatMoney(totalSpent, 'INR')}</div><div class="stat-label">Total Spent</div></div>
    </div>

    ${unread.length ? `
    <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:var(--radius-sm);padding:.85rem 1rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:.75rem">
      <span style="font-size:1.25rem">🔔</span>
      <div>
        <div style="font-weight:700;font-size:.875rem">${unread.length} unread notification${unread.length > 1 ? 's' : ''}</div>
        <div style="font-size:.78rem;color:var(--muted)">${escapeHtml(unread[0].title)}</div>
      </div>
      <button class="btn btn-sm" style="margin-left:auto;background:#fff;border:1.5px solid var(--border)" onclick="switchTab('notifications')">View all</button>
    </div>` : ''}

    ${won.filter(a => !payments.find(p => p.auction_id === a.id && p.status === 'paid')).length ? `
    <div style="background:#ecfdf5;border:1.5px solid #a7f3d0;border-radius:var(--radius-sm);padding:.85rem 1rem;margin-bottom:1.25rem">
      <div style="font-weight:700;font-size:.875rem;color:#065f46;margin-bottom:.5rem">🏆 Pending payments — items you won</div>
      ${won.filter(a => !payments.find(p => p.auction_id === a.id && p.status === 'paid')).map(a => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.4rem 0;border-bottom:1px solid #d1fae5">
          <div style="font-size:.875rem;font-weight:600">${escapeHtml(a.title)}</div>
          <a href="/auction.html?id=${a.id}" class="btn btn-success btn-sm">Pay now</a>
        </div>`).join('')}
    </div>` : ''}

    <div class="dash-section-title" style="margin-top:1.5rem">Recent transactions</div>
    ${payments.slice(0,5).length ? `
    <div style="background:var(--card);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden">
      <table class="txn-table">
        <thead><tr><th>Item</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${payments.slice(0,5).map(p => `
          <tr>
            <td><a href="/auction.html?id=${p.auction_id}" style="font-weight:600">${escapeHtml(p.auction_title)}</a></td>
            <td style="font-weight:700">${formatMoney(p.amount, p.currency)}</td>
            <td><span class="status-pill status-${p.status}">${p.status}</span></td>
            <td style="color:var(--muted)">${new Date(p.created_at).toLocaleDateString()}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <button class="btn btn-sm" style="margin-top:.75rem;background:#f4f4f5;color:var(--text)" onclick="switchTab('transactions')">View all transactions →</button>
    ` : '<p style="color:var(--muted);font-size:.875rem">No transactions yet.</p>'}`;
}

// ── Notifications ─────────────────────────────────────────────────
async function showNotifications() {
  const items = await api('/notifications');
  const unread = items.filter(n => !n.read_flag);
  const badge = document.getElementById('notif-count');
  if (badge) { badge.textContent = unread.length; badge.style.display = unread.length ? 'inline' : 'none'; }

  document.getElementById('panel').innerHTML = `
    <div class="dash-section-title">🔔 Notifications ${unread.length ? `<span style="font-size:.8rem;font-weight:600;color:var(--danger)">${unread.length} unread</span>` : ''}</div>
    ${!items.length ? '<div class="empty-state"><p style="font-size:2rem">🔔</p><p>No notifications yet.</p></div>' :
    `<div style="display:flex;flex-direction:column;gap:.5rem">${items.map(n => `
      <div style="background:${n.read_flag ? 'var(--card)' : '#fffbeb'};border:1.5px solid ${n.read_flag ? 'var(--border)' : '#fde68a'};border-radius:var(--radius-sm);padding:.9rem 1rem">
        <div style="font-weight:${n.read_flag ? '500' : '700'};font-size:.875rem">${escapeHtml(n.title)}</div>
        <div style="font-size:.8rem;color:var(--muted);margin-top:.2rem">${escapeHtml(n.message || '')}</div>
        <div style="font-size:.7rem;color:var(--muted);margin-top:.3rem">${new Date(n.created_at).toLocaleString()}</div>
      </div>`).join('')}</div>`}`;

  await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
  if (badge) badge.style.display = 'none';
}

// ── Listings ──────────────────────────────────────────────────────
async function showListings() {
  const all = await api('/auctions/mine');
  const mine = all.filter(a => a.seller_id === user.id);
  document.getElementById('panel').innerHTML = `
    <div class="dash-section-title">📦 My Listings</div>
    ${!mine.length
      ? `<div class="empty-state"><p style="font-size:2rem">📦</p><p>No listings yet.</p><a href="/sell.html" class="btn btn-dark" style="margin-top:.75rem">List an item</a></div>`
      : mine.map(a => {
          const seconds = Math.max(0, Math.floor((new Date(a.ends_at) - Date.now()) / 1000));
          return `
          <div class="list-row" onclick="location.href='/auction.html?id=${a.id}'">
            <div style="display:flex;align-items:center;gap:.75rem;flex:1;min-width:0">
              <div style="width:42px;height:42px;border-radius:var(--radius-sm);background:#e0e7ff;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0">${a.image_path ? `<img src="${a.image_path}" style="width:42px;height:42px;object-fit:cover;border-radius:var(--radius-sm)">` : '📦'}</div>
              <div style="min-width:0">
                <div class="list-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(a.title)}</div>
                <div class="list-sub">${formatMoney(a.current_bid || a.starting_bid, a.currency)} · ${a.bid_count} bids · ${a.status}</div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <span style="font-size:.72rem;color:var(--muted)">${a.status === 'active' ? '⏱ ' + formatTimer(seconds) : ''}</span>
            </div>
          </div>`;
        }).join('')}`;
}

// ── Bids ──────────────────────────────────────────────────────────
async function showBids() {
  const all = await api('/auctions/mine');
  const bids = all.filter(a => a.current_bidder_id === user.id || a.winner_id === user.id);
  const payments = await api('/payments/mine');

  document.getElementById('panel').innerHTML = `
    <div class="dash-section-title">🏷️ My Bids</div>
    ${!bids.length
      ? `<div class="empty-state"><p style="font-size:2rem">🏷️</p><p>No bids placed yet.</p><a href="/" class="btn btn-dark" style="margin-top:.75rem">Browse auctions</a></div>`
      : bids.map(a => {
          const leading = a.current_bidder_id === user.id && a.status === 'active';
          const won     = a.winner_id === user.id && a.status === 'sold';
          const paid    = payments.find(p => p.auction_id === a.id && p.status === 'paid');
          const outbid  = !leading && !won && a.status === 'active';
          return `
          <div class="list-row" onclick="location.href='/auction.html?id=${a.id}'">
            <div style="flex:1;min-width:0">
              <div class="list-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(a.title)}</div>
              <div class="list-sub">${formatMoney(a.current_bid, a.currency)} · ${a.status}</div>
            </div>
            <div style="display:flex;align-items:center;gap:.5rem;flex-shrink:0">
              ${leading ? '<span class="badge-leading">Leading ✓</span>'     : ''}
              ${outbid  ? '<span class="badge-outbid">Outbid ↑</span>'       : ''}
              ${won && !paid ? '<span class="badge-won">Won 🏆</span><a href="/auction.html?id='+a.id+'" class="btn btn-success btn-sm" onclick="event.stopPropagation()">Pay now</a>' : ''}
              ${won && paid  ? '<span class="badge-won">Paid ✓</span>'       : ''}
              ${won ? `<button class="btn btn-sm" style="background:#f4f4f5;color:var(--text)" onclick="event.stopPropagation();showReviewModal(${a.id},${a.seller_id},'${escapeHtml(a.title).replace(/'/g,'')}')">★ Review</button>` : ''}
            </div>
          </div>`;
        }).join('')}`;
}

// ── Transactions ──────────────────────────────────────────────────
async function showTransactions() {
  const payments = await api('/payments/mine');
  const totalPaid   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === 'pending').length;

  document.getElementById('panel').innerHTML = `
    <div class="dash-section-title">💳 Transactions</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.85rem;margin-bottom:1.5rem">
      <div class="stat-card"><div class="stat-val">${payments.length}</div><div class="stat-label">Total Orders</div></div>
      <div class="stat-card"><div class="stat-val">${formatMoney(totalPaid,'INR')}</div><div class="stat-label">Total Paid</div></div>
      <div class="stat-card"><div class="stat-val">${totalPending}</div><div class="stat-label">Pending</div></div>
    </div>
    ${!payments.length
      ? `<div class="empty-state"><p style="font-size:2rem">💳</p><p>No transactions yet.</p></div>`
      : `<div style="background:var(--card);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden;overflow-x:auto">
          <table class="txn-table">
            <thead><tr><th>#</th><th>Item</th><th>Amount</th><th>Commission</th><th>Seller Payout</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>${payments.map((p, i) => `
              <tr>
                <td style="color:var(--muted);font-size:.75rem">#${p.id}</td>
                <td><a href="/auction.html?id=${p.auction_id}" style="font-weight:600">${escapeHtml(p.auction_title)}</a>
                  ${p.razorpay_payment_id ? `<br><span style="font-size:.7rem;color:var(--muted)">${escapeHtml(p.razorpay_payment_id)}</span>` : ''}</td>
                <td style="font-weight:800">${formatMoney(p.amount, p.currency)}</td>
                <td style="color:var(--muted)">${formatMoney(p.commission_amount, p.currency)}</td>
                <td style="color:var(--success);font-weight:600">${formatMoney(p.seller_payout, p.currency)}</td>
                <td><span class="status-pill status-${p.status}">${p.status}</span></td>
                <td style="color:var(--muted);font-size:.78rem">${new Date(p.created_at).toLocaleString()}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`}`;
}

// ── Profile ───────────────────────────────────────────────────────
async function showProfile() {
  const me = await api('/auth/me');
  document.getElementById('panel').innerHTML = `
    <div class="dash-section-title">👤 Profile & Security</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;align-items:start">

      <div class="auth-card" style="max-width:100%">
        <h3 style="font-size:1rem;font-weight:800;margin-bottom:1rem">Personal info</h3>
        <div id="profile-alert"></div>
        <form id="profile-form">
          <label>Full name</label>
          <input type="text" id="p-name" value="${escapeHtml(me.name)}" required maxlength="120" />
          <label>Phone</label>
          <input type="tel" id="p-phone" value="${escapeHtml(me.phone || '')}" maxlength="20" placeholder="Optional" />
          <label>Email <span style="font-weight:400;color:var(--muted)">(cannot change)</span></label>
          <input type="email" value="${escapeHtml(me.email)}" disabled />
          <div style="display:flex;gap:.5rem;margin-top:1rem;font-size:.78rem;color:var(--muted)">
            <span>Member since ${new Date(me.created_at).toLocaleDateString()}</span>
            <span style="margin-left:auto;background:${me.verified ? '#d1fae5' : '#fef3c7'};color:${me.verified ? '#065f46' : '#92400e'};padding:.15rem .5rem;border-radius:var(--radius-pill);font-weight:700">
              ${me.verified ? '✓ Verified' : 'Unverified'}
            </span>
          </div>
          <button type="submit" class="btn btn-dark btn-block" style="margin-top:1rem" id="save-btn">Save changes</button>
        </form>
      </div>

      <div class="auth-card" style="max-width:100%">
        <h3 style="font-size:1rem;font-weight:800;margin-bottom:1rem">Change password</h3>
        <div id="pass-alert"></div>
        <form id="pass-form">
          <label>Current password</label>
          <input type="password" id="p-cur-pass" autocomplete="current-password" placeholder="Your current password" />
          <label>New password</label>
          <input type="password" id="p-new-pass" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" />
          <label>Confirm new password</label>
          <input type="password" id="p-confirm-pass" autocomplete="new-password" minlength="6" placeholder="Repeat new password" />
          <button type="submit" class="btn btn-dark btn-block" style="margin-top:1rem" id="pass-btn">Update password</button>
        </form>
      </div>
    </div>`;

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-btn');
    btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      const updated = await api('/auth/me', { method: 'PATCH', body: JSON.stringify({
        name: document.getElementById('p-name').value,
        phone: document.getElementById('p-phone').value,
      })});
      setUser({ ...user, name: updated.name, phone: updated.phone });
      if (sidebarName) sidebarName.textContent = updated.name;
      if (avatarEl)    avatarEl.textContent    = updated.name.charAt(0).toUpperCase();
      document.getElementById('profile-alert').innerHTML = '<div class="alert alert-success">Profile updated!</div>';
      showToast('Profile updated!', 'success');
    } catch (err) {
      document.getElementById('profile-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
    btn.textContent = 'Save changes'; btn.disabled = false;
  });

  document.getElementById('pass-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('p-new-pass').value;
    const confirm = document.getElementById('p-confirm-pass').value;
    if (newPass !== confirm) {
      document.getElementById('pass-alert').innerHTML = '<div class="alert alert-error">Passwords do not match.</div>';
      return;
    }
    const btn = document.getElementById('pass-btn');
    btn.textContent = 'Updating…'; btn.disabled = true;
    try {
      await api('/auth/me', { method: 'PATCH', body: JSON.stringify({
        current_password: document.getElementById('p-cur-pass').value,
        new_password: newPass,
      })});
      document.getElementById('pass-alert').innerHTML = '<div class="alert alert-success">Password updated!</div>';
      showToast('Password updated!', 'success');
      e.target.reset();
    } catch (err) {
      document.getElementById('pass-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
    btn.textContent = 'Update password'; btn.disabled = false;
  });
}

// ── Review modal ──────────────────────────────────────────────────
window.showReviewModal = function(auctionId, sellerId, title) {
  document.getElementById('review-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'review-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem';
  modal.innerHTML = `
    <div class="auth-card" style="max-width:400px;width:100%">
      <h2 style="font-size:1rem;font-weight:800;margin-bottom:.25rem">Leave a review</h2>
      <p style="font-size:.82rem;color:var(--muted);margin-bottom:1rem">${escapeHtml(title)}</p>
      <div id="review-alert"></div>
      <form id="review-form">
        <label>Your rating</label>
        <div id="star-picker" style="display:flex;gap:.5rem;font-size:2rem;margin:.4rem 0 1rem" role="group">
          ${[1,2,3,4,5].map(n=>`<span data-val="${n}" style="cursor:pointer;color:#d4d4d8;transition:color .1s" tabindex="0">★</span>`).join('')}
        </div>
        <input type="hidden" id="review-rating" />
        <label>Comment <span style="font-weight:400;color:var(--muted)">(optional)</span></label>
        <textarea id="review-comment" rows="3" maxlength="500" placeholder="How was your experience?"></textarea>
        <div style="display:flex;gap:.6rem;margin-top:1rem">
          <button type="button" class="btn btn-sm" style="flex:1;background:#f4f4f5;color:var(--text)" id="review-cancel">Cancel</button>
          <button type="submit" class="btn btn-dark btn-sm" style="flex:2">Submit</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  let sel = 0;
  const stars = modal.querySelectorAll('#star-picker span');
  const hi = n => stars.forEach((s,i) => s.style.color = i < n ? '#f59e0b' : '#d4d4d8');
  stars.forEach(s => {
    s.addEventListener('click', () => { sel = +s.dataset.val; document.getElementById('review-rating').value = sel; hi(sel); });
    s.addEventListener('mouseenter', () => hi(+s.dataset.val));
    s.addEventListener('mouseleave', () => hi(sel));
    s.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') s.click(); });
  });
  document.getElementById('review-cancel').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!sel) { document.getElementById('review-alert').innerHTML = '<div class="alert alert-error">Pick a star rating.</div>'; return; }
    try {
      await api('/reviews', { method: 'POST', body: JSON.stringify({ seller_id: sellerId, auction_id: auctionId, rating: sel, comment: document.getElementById('review-comment').value }) });
      showToast('Review submitted!', 'success'); modal.remove();
    } catch (err) {
      document.getElementById('review-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  });
};

// ── Tab routing ───────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.dash-nav-item').forEach(t => t.classList.remove('active'));
  document.querySelector(`.dash-nav-item[data-tab="${name}"]`)?.classList.add('active');
  document.getElementById('panel').innerHTML = '<div class="empty-state"><p style="font-size:1.5rem">⏳</p></div>';
  const map = { overview: showOverview, notifications: showNotifications, selling: showListings, bidding: showBids, transactions: showTransactions, profile: showProfile };
  (map[name] || showOverview)();
}
window.switchTab = switchTab;

document.querySelectorAll('.dash-nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Load unread count badge
api('/notifications').then(items => {
  const unread = items.filter(n => !n.read_flag).length;
  const badge = document.getElementById('notif-count');
  if (badge && unread) { badge.textContent = unread; badge.style.display = 'inline'; }
}).catch(() => {});

switchTab('overview');
