if (!getToken()) location.href = '/login.html';

const user = getUser();
document.getElementById('welcome').textContent = `Hi, ${user?.name || 'Bidder'}`;

document.getElementById('logout-btn').onclick = () => {
  setToken(null);
  setUser(null);
  location.href = '/';
};

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

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
      : all.filter((a) => a.current_bidder_id === user.id || a.winner_id === user.id);

  document.getElementById('panel').innerHTML = filtered.length
    ? `<div class="auction-grid">${filtered
        .map(
          (a) => {
            const isWon = a.winner_id === user.id && a.status === 'sold';
            return `<article class="auction-card">
              <div class="body" onclick="location.href='/auction.html?id=${a.id}'" style="cursor:pointer">
                <h3>${escapeHtml(a.title)}</h3>
                <p>${formatMoney(a.current_bid || a.starting_bid, a.currency)} · <strong>${a.status}</strong></p>
              </div>
              ${isWon ? `<div style="padding:0 1rem 1rem">
                <button class="btn btn-outline" style="width:100%;font-size:0.85rem" onclick="showReviewModal(${a.id}, ${a.seller_id}, '${escapeHtml(a.title)}')">★ Leave a review</button>
              </div>` : ''}
            </article>`;
          }
        )
        .join('')}</div>`
    : '<p class="empty-state">Nothing here yet.</p>';
}

async function showProfile() {
  const me = await api('/auth/me');
  document.getElementById('panel').innerHTML = `
    <div class="auth-card" style="max-width:480px">
      <h2 style="margin-top:0">Edit profile</h2>
      <div id="profile-alert"></div>
      <form id="profile-form">
        <label>Name</label>
        <input type="text" id="p-name" value="${escapeHtml(me.name)}" required maxlength="120" />
        <label>Phone</label>
        <input type="tel" id="p-phone" value="${escapeHtml(me.phone || '')}" maxlength="20" placeholder="Optional" />
        <label>Email</label>
        <input type="email" value="${escapeHtml(me.email)}" disabled />
        <hr style="margin:1rem 0;border:none;border-top:1px solid #eee" />
        <h3 style="margin:0 0 0.5rem">Change password</h3>
        <label>Current password</label>
        <input type="password" id="p-cur-pass" autocomplete="current-password" placeholder="Leave blank to keep password" />
        <label>New password</label>
        <input type="password" id="p-new-pass" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" />
        <button type="submit" class="btn btn-primary" style="margin-top:1rem;width:100%">Save changes</button>
      </form>
    </div>`;

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('profile-alert');
    const body = {
      name: document.getElementById('p-name').value,
      phone: document.getElementById('p-phone').value,
    };
    const curPass = document.getElementById('p-cur-pass').value;
    const newPass = document.getElementById('p-new-pass').value;
    if (newPass) {
      body.current_password = curPass;
      body.new_password = newPass;
    }
    try {
      const updated = await api('/auth/me', { method: 'PATCH', body: JSON.stringify(body) });
      setUser({ ...user, name: updated.name, phone: updated.phone });
      document.getElementById('welcome').textContent = `Hi, ${updated.name}`;
      alertEl.innerHTML = '<div class="alert alert-success">Profile updated successfully.</div>';
      document.getElementById('p-cur-pass').value = '';
      document.getElementById('p-new-pass').value = '';
    } catch (err) {
      alertEl.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

// ── Review modal ─────────────────────────────────────────────────────────────
window.showReviewModal = function (auctionId, sellerId, title) {
  const existing = document.getElementById('review-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'review-modal';
  modal.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999';
  modal.innerHTML = `
    <div class="auth-card" style="width:100%;max-width:400px;margin:1rem">
      <h2 style="margin-top:0">Review seller</h2>
      <p style="color:var(--muted);margin-bottom:1rem">${escapeHtml(title)}</p>
      <div id="review-alert"></div>
      <form id="review-form">
        <label>Rating</label>
        <div id="star-picker" style="display:flex;gap:0.5rem;font-size:1.8rem;margin-bottom:1rem" role="group" aria-label="Star rating">
          ${[1,2,3,4,5].map(n => `<span data-val="${n}" style="cursor:pointer;color:#ccc" tabindex="0" role="radio" aria-label="${n} star${n>1?'s':''}" aria-checked="false">★</span>`).join('')}
        </div>
        <input type="hidden" id="review-rating" value="" />
        <label>Comment (optional)</label>
        <textarea id="review-comment" rows="3" maxlength="500" placeholder="How was your experience?"></textarea>
        <div style="display:flex;gap:0.5rem;margin-top:1rem">
          <button type="button" class="btn btn-outline" id="review-cancel" style="flex:1">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex:1">Submit</button>
        </div>
      </form>
    </div>`;

  document.body.appendChild(modal);

  // Star picker
  const stars = modal.querySelectorAll('#star-picker span');
  let selectedRating = 0;
  function highlightStars(n) {
    stars.forEach((s, i) => {
      s.style.color = i < n ? '#f59e0b' : '#ccc';
    });
  }
  stars.forEach((s) => {
    s.addEventListener('click', () => {
      selectedRating = Number(s.dataset.val);
      document.getElementById('review-rating').value = selectedRating;
      highlightStars(selectedRating);
      stars.forEach((st, i) => st.setAttribute('aria-checked', i < selectedRating ? 'true' : 'false'));
    });
    s.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') s.click();
    });
    s.addEventListener('mouseenter', () => highlightStars(Number(s.dataset.val)));
    s.addEventListener('mouseleave', () => highlightStars(selectedRating));
  });

  document.getElementById('review-cancel').onclick = () => modal.remove();
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = Number(document.getElementById('review-rating').value);
    if (!rating) {
      document.getElementById('review-alert').innerHTML =
        '<div class="alert alert-error">Please select a star rating.</div>';
      return;
    }
    const comment = document.getElementById('review-comment').value;
    try {
      await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({ seller_id: sellerId, auction_id: auctionId, rating, comment }),
      });
      modal.remove();
    } catch (err) {
      document.getElementById('review-alert').innerHTML =
        `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  });
};

// ── Tab routing ───────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const name = tab.dataset.tab;
    if (name === 'notifications') showNotifications();
    else if (name === 'profile') showProfile();
    else showListings(name);
  });
});

showNotifications();
