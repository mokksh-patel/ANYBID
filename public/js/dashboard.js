if (!getToken()) location.href = '/login.html';

const user = getUser();

// Header setup
const welcomeEl = document.getElementById('welcome');
const emailEl   = document.getElementById('user-email');
const avatarEl  = document.getElementById('avatar');
if (welcomeEl) welcomeEl.textContent = user?.name || 'My Account';
if (emailEl)   emailEl.textContent   = user?.email || '';
if (avatarEl && user?.name) avatarEl.textContent = user.name.charAt(0).toUpperCase();

document.getElementById('logout-btn').onclick = () => {
  setToken(null); setUser(null); location.href = '/';
};

function escapeHtml(s) {
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

// ── Notifications ─────────────────────────────────────────────────
async function showNotifications() {
  const items = await api('/notifications');
  if (!items.length) {
    document.getElementById('panel').innerHTML = '<div class="empty-state"><p style="font-size:2rem">🔔</p><p>No notifications yet.</p><p>Place a bid or list an item to get started.</p></div>';
    return;
  }
  document.getElementById('panel').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.5rem">${items.map(n => `
      <div style="background:var(--card);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:1rem;${n.read_flag ? 'opacity:.65' : ''}">
        <div style="font-weight:${n.read_flag ? '500' : '700'};font-size:.875rem">${escapeHtml(n.title)}</div>
        <div style="font-size:.8rem;color:var(--muted);margin-top:.2rem">${escapeHtml(n.message || '')}</div>
        <div style="font-size:.72rem;color:var(--muted);margin-top:.3rem">${new Date(n.created_at).toLocaleString()}</div>
      </div>`).join('')}
    </div>`;
  await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
}

// ── Listings / Bids ───────────────────────────────────────────────
async function showListings(type) {
  const all = await api('/auctions/mine');
  const filtered = type === 'selling'
    ? all.filter(a => a.seller_id === user.id)
    : all.filter(a => a.current_bidder_id === user.id || a.winner_id === user.id);

  if (!filtered.length) {
    document.getElementById('panel').innerHTML = '<div class="empty-state"><p style="font-size:2rem">' + (type === 'selling' ? '📦' : '🏷') + '</p><p>' + (type === 'selling' ? 'You haven\'t listed anything yet.' : 'No bids placed yet.') + '</p></div>';
    return;
  }

  document.getElementById('panel').innerHTML = filtered.map(a => {
    const isWon    = a.winner_id === user.id && a.status === 'sold';
    const leading  = type === 'bidding' && a.current_bidder_id === user.id && a.status === 'active';
    const outbid   = type === 'bidding' && a.current_bidder_id !== user.id && a.winner_id !== user.id;
    return `
      <div class="list-row" onclick="location.href='/auction.html?id=${a.id}'">
        <div>
          <div class="list-title">${escapeHtml(a.title)}</div>
          <div class="list-sub">${formatMoney(a.current_bid || a.starting_bid, a.currency)} · ${a.status}</div>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem;flex-shrink:0">
          ${leading  ? '<span class="badge-leading">Leading ✓</span>' : ''}
          ${outbid   ? '<span class="badge-outbid">Outbid</span>'    : ''}
          ${isWon    ? '<span class="badge-won">Won 🏆</span>'       : ''}
          ${isWon    ? `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();showReviewModal(${a.id},${a.seller_id},'${escapeHtml(a.title).replace(/'/g,'')}')">★ Review</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ── Profile ───────────────────────────────────────────────────────
async function showProfile() {
  const me = await api('/auth/me');
  document.getElementById('panel').innerHTML = `
    <div class="auth-card" style="max-width:480px">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:1rem">Edit profile</h2>
      <div id="profile-alert"></div>
      <form id="profile-form">
        <label>Full name</label>
        <input type="text" id="p-name" value="${escapeHtml(me.name)}" required maxlength="120" />
        <label>Phone</label>
        <input type="tel" id="p-phone" value="${escapeHtml(me.phone || '')}" maxlength="20" placeholder="Optional" />
        <label>Email</label>
        <input type="email" value="${escapeHtml(me.email)}" disabled />
        <hr class="divider" />
        <h3 style="font-size:.9rem;font-weight:700;margin-bottom:.25rem">Change password</h3>
        <label>Current password</label>
        <input type="password" id="p-cur-pass" autocomplete="current-password" placeholder="Leave blank to keep password" />
        <label>New password</label>
        <input type="password" id="p-new-pass" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" />
        <button type="submit" class="btn btn-dark btn-block" style="margin-top:1.25rem" id="save-btn">Save changes</button>
      </form>
    </div>`;

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-btn');
    btn.textContent = 'Saving…'; btn.disabled = true;
    const body = { name: document.getElementById('p-name').value, phone: document.getElementById('p-phone').value };
    const newPass = document.getElementById('p-new-pass').value;
    if (newPass) { body.current_password = document.getElementById('p-cur-pass').value; body.new_password = newPass; }
    try {
      const updated = await api('/auth/me', { method: 'PATCH', body: JSON.stringify(body) });
      setUser({ ...user, name: updated.name, phone: updated.phone });
      if (welcomeEl) welcomeEl.textContent = updated.name;
      if (avatarEl)  avatarEl.textContent  = updated.name.charAt(0).toUpperCase();
      document.getElementById('profile-alert').innerHTML = '<div class="alert alert-success">Profile updated!</div>';
      document.getElementById('p-cur-pass').value = '';
      document.getElementById('p-new-pass').value = '';
    } catch (err) {
      document.getElementById('profile-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
    btn.textContent = 'Save changes'; btn.disabled = false;
  });
}

// ── Review modal ──────────────────────────────────────────────────
window.showReviewModal = function(auctionId, sellerId, title) {
  document.getElementById('review-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'review-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem';
  modal.innerHTML = `
    <div class="auth-card" style="max-width:400px">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:.25rem">Leave a review</h2>
      <p style="font-size:.82rem;color:var(--muted);margin-bottom:1rem">${escapeHtml(title)}</p>
      <div id="review-alert"></div>
      <form id="review-form">
        <label>Your rating</label>
        <div id="star-picker" style="display:flex;gap:.5rem;font-size:2rem;margin:.4rem 0 1rem" role="group" aria-label="Star rating">
          ${[1,2,3,4,5].map(n => `<span data-val="${n}" style="cursor:pointer;color:#d4d4d8;transition:color .1s" tabindex="0" role="radio" aria-label="${n} star${n>1?'s':''}" aria-checked="false">★</span>`).join('')}
        </div>
        <input type="hidden" id="review-rating" value="" />
        <label>Comment <span style="font-weight:400;color:var(--muted)">(optional)</span></label>
        <textarea id="review-comment" rows="3" maxlength="500" placeholder="How was your experience with this seller?"></textarea>
        <div style="display:flex;gap:.6rem;margin-top:1.25rem">
          <button type="button" class="btn btn-sm" style="flex:1;background:#f4f4f5;color:var(--text)" id="review-cancel">Cancel</button>
          <button type="submit" class="btn btn-dark btn-sm" style="flex:2">Submit review</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);

  let selectedRating = 0;
  const stars = modal.querySelectorAll('#star-picker span');
  const highlight = (n) => stars.forEach((s, i) => s.style.color = i < n ? '#f59e0b' : '#d4d4d8');
  stars.forEach(s => {
    s.addEventListener('click', () => {
      selectedRating = Number(s.dataset.val);
      document.getElementById('review-rating').value = selectedRating;
      highlight(selectedRating);
      stars.forEach((st, i) => st.setAttribute('aria-checked', i < selectedRating ? 'true' : 'false'));
    });
    s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') s.click(); });
    s.addEventListener('mouseenter', () => highlight(Number(s.dataset.val)));
    s.addEventListener('mouseleave', () => highlight(selectedRating));
  });

  document.getElementById('review-cancel').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = Number(document.getElementById('review-rating').value);
    if (!rating) {
      document.getElementById('review-alert').innerHTML = '<div class="alert alert-error">Please select a star rating.</div>';
      return;
    }
    try {
      await api('/reviews', { method: 'POST', body: JSON.stringify({ seller_id: sellerId, auction_id: auctionId, rating, comment: document.getElementById('review-comment').value }) });
      showToast('Review submitted!', 'success');
      modal.remove();
    } catch (err) {
      document.getElementById('review-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  });
};

// ── Tabs ──────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const name = tab.dataset.tab;
    if      (name === 'notifications') showNotifications();
    else if (name === 'profile')       showProfile();
    else                               showListings(name);
  });
});

showNotifications();
