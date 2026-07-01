const params = new URLSearchParams(location.search);
const auctionId = params.get('id');
if (!auctionId) location.href = '/';

const GRADIENTS = ['g1','g2','g3','g4','g5','g6'];
function gradientFor(id) { return GRADIENTS[Number(id) % GRADIENTS.length]; }

let auctionData = null;
let eventSource = null;

function escapeHtml(s) {
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

async function loadAuction() {
  const { auction, bids } = await api(`/auctions/${auctionId}`);
  auctionData = auction;
  render(auction, bids);
  connectStream();
}

function emojiFor(a) {
  const m = { Electronics:'📱', Fashion:'👗', Handmade:'🎨', Vehicles:'🚗', 'Real Estate':'🏠', 'Home':'🛋️', 'Weird & Fun':'🎭' };
  return m[a.category] || '📦';
}

function render(auction, bids) {
  const user = getUser();
  const isSeller  = user && user.id === auction.seller_id;
  const isWinner  = user && auction.winner_id === user.id;
  const canBid    = auction.status === 'active' && user && !isSeller;
  const reserveMet = Number(auction.current_bid) >= Number(auction.floor_price);
  const seconds   = Math.max(0, Math.floor((new Date(auction.ends_at) - Date.now()) / 1000));
  const ended     = auction.status !== 'active';
  const urgent    = !ended && seconds < 120;

  document.title = `${auction.title} — AnyBid`;

  const thumbContent = auction.image_path
    ? `<img src="${auction.image_path}" alt="${escapeHtml(auction.title)}" style="width:100%;height:100%;object-fit:contain" />`
    : `<div class="${gradientFor(auction.id)}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:6rem">${emojiFor(auction)}</div>`;

  let statusHtml = '';
  if (auction.status === 'sold')       statusHtml = `<div class="alert alert-success">SOLD — winner must complete payment</div>`;
  else if (auction.status === 'no_sale') statusHtml = `<div class="alert alert-warn">Auction ended — floor price was not met. No sale.</div>`;
  else if (auction.status === 'cancelled') statusHtml = `<div class="alert alert-error">This listing was cancelled.</div>`;

  let actionHtml = '';
  if (canBid) {
    const minBid = auction.bid_count > 0
      ? Number(auction.current_bid) + Math.max(50, Math.round(Number(auction.current_bid) * 0.02))
      : Number(auction.starting_bid);
    actionHtml = `
      <form class="bid-form" id="bid-form">
        <input type="number" id="bid-amount" step="1" min="${minBid}" placeholder="Min ${formatMoney(minBid, auction.currency)}" required />
        <button type="submit" class="btn btn-dark">Place Bid</button>
      </form>
      <p style="font-size:.75rem;color:var(--muted);margin-top:.4rem">Minimum bid: <strong>${formatMoney(minBid, auction.currency)}</strong> · BidRush extends timer on last 60s</p>`;
  }
  if (isSeller && auction.status === 'active' && auction.bid_count === 0) {
    actionHtml += `<button class="btn btn-danger btn-sm" id="cancel-btn" style="margin-top:.75rem">Withdraw listing</button>`;
  }
  if (isWinner && auction.status === 'sold') {
    actionHtml += `<button class="btn btn-success btn-block" id="pay-btn" style="margin-top:.75rem;padding:.75rem">💳 Complete payment via Razorpay</button>`;
  }

  const floorClass = !reserveMet ? 'no-sale' : 'floor-box';

  document.getElementById('content').innerHTML = `
    <div class="detail-wrap">
      <div class="detail-grid">
        <div class="detail-image">${thumbContent}</div>
        <div class="detail-body">
          <span class="detail-category">${escapeHtml(auction.category)}</span>
          <h1 class="detail-title">${escapeHtml(auction.title)}</h1>
          ${auction.property_location ? `<p style="color:var(--muted);font-size:.85rem;margin-bottom:.4rem">📍 ${escapeHtml(auction.property_location)}${auction.property_area_sqft ? ` · ${Number(auction.property_area_sqft).toLocaleString()} sq ft` : ''}</p>` : ''}
          <p class="detail-desc">${escapeHtml(auction.description || '')}</p>
          <div class="seller-row">
            <strong>${escapeHtml(auction.seller_name)}</strong>
            ${auction.seller_rating ? `<span class="stars">★ ${auction.seller_rating}</span>` : ''}
          </div>
          <div class="bid-box">
            <div class="bid-box-row">
              <div>
                <div class="current-bid-label">Current bid</div>
                <div class="current-bid-amount" id="live-bid">${formatMoney(auction.current_bid || auction.starting_bid, auction.currency)}</div>
                <div style="font-size:.78rem;color:var(--muted);margin-top:.15rem" id="live-bidcount">${auction.bid_count} bids</div>
              </div>
              <span class="countdown-pill ${ended ? 'ended' : urgent ? 'urgent' : ''}" id="countdown">
                ${ended ? 'ENDED' : '⏱ ' + formatTimer(seconds)}
              </span>
            </div>
            <div style="margin-top:.6rem">
              <span class="reserve-badge ${reserveMet ? 'reserve-met' : 'reserve-not'}">
                ${reserveMet ? 'Reserve met ✓' : 'Reserve not met'}
              </span>
              <span style="font-size:.75rem;color:var(--muted);margin-left:.5rem">Floor: <strong>${formatMoney(auction.floor_price, auction.currency)}</strong></span>
            </div>
            ${actionHtml}
          </div>
          <div class="floor-box ${floorClass}" style="margin-top:.75rem">
            <strong>FAIR floor price:</strong> Sale only happens at ${formatMoney(auction.floor_price, auction.currency)} or above. Starting bid: ${formatMoney(auction.starting_bid, auction.currency)}.
          </div>
          ${statusHtml}
          <p class="commission-note" id="shipping-note" style="margin-top:.5rem"></p>
        </div>
      </div>
    </div>
    <div class="bid-history-card">
      <h3>Transparent bid history</h3>
      <table>
        <thead><tr><th>Bidder</th><th>Amount</th><th>Time</th></tr></thead>
        <tbody id="bid-rows">
          ${bids.length
            ? bids.map(b => `<tr class="${user && b.bidder_id === user.id ? 'you-row' : ''}">
                <td>${escapeHtml(b.bidder_name)}${user && b.bidder_id === user.id ? ' <strong>(you)</strong>' : ''}</td>
                <td><strong>${formatMoney(b.amount, auction.currency)}</strong></td>
                <td style="color:var(--muted)">${new Date(b.created_at).toLocaleString()}</td>
              </tr>`).join('')
            : '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:1.5rem">No bids yet — be the first!</td></tr>'}
        </tbody>
      </table>
    </div>`;

  if (document.getElementById('bid-form'))    document.getElementById('bid-form').addEventListener('submit', placeBid);
  if (document.getElementById('cancel-btn')) document.getElementById('cancel-btn').addEventListener('click', cancelListing);
  if (document.getElementById('pay-btn'))    document.getElementById('pay-btn').addEventListener('click', startPayment);
  loadShipping(auction);
}

async function loadShipping(auction) {
  if (auction.listing_type === 'real_estate') return;
  try {
    const est = await api(`/auctions/shipping-estimate?weightKg=${auction.shipping_weight_kg || 0.5}`);
    const el = document.getElementById('shipping-note');
    if (el) el.textContent = `🚚 Estimated shipping: ₹${est.amount} (${est.note})`;
  } catch {}
}

function connectStream() {
  if (eventSource) eventSource.close();
  eventSource = new EventSource(`/api/auctions/${auctionId}/stream`);
  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    const cd = document.getElementById('countdown');
    if (cd) {
      const seconds = data.seconds_left;
      const ended   = seconds <= 0 || data.status !== 'active';
      const urgent  = !ended && seconds < 120;
      cd.textContent = ended ? 'ENDED' : `⏱ ${formatTimer(seconds)}`;
      cd.className = `countdown-pill ${ended ? 'ended' : urgent ? 'urgent' : ''}`;
    }
    const bidEl  = document.getElementById('live-bid');
    const cntEl  = document.getElementById('live-bidcount');
    if (bidEl && auctionData) bidEl.textContent = formatMoney(data.current_bid, auctionData.currency);
    if (cntEl) cntEl.textContent = `${data.bid_count} bids`;

    if (auctionData) {
      auctionData.current_bid  = data.current_bid;
      auctionData.bid_count    = data.bid_count;
      auctionData.status       = data.status;
      auctionData.ends_at      = data.ends_at;
    }
    if (data.status !== 'active') loadAuction();
  };
}

async function placeBid(e) {
  e.preventDefault();
  if (!getToken()) return (location.href = '/login.html');
  const amount = Number(document.getElementById('bid-amount').value);
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Placing bid…'; btn.disabled = true;
  try {
    const res = await api(`/bids/${auctionId}`, { method: 'POST', body: JSON.stringify({ amount }) });
    showToast(res.message || 'Bid placed!', 'success');
    document.getElementById('alert').innerHTML = '';
    loadAuction();
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    btn.textContent = 'Place Bid'; btn.disabled = false;
  }
}

async function cancelListing() {
  if (!confirm('Withdraw this listing? (Only possible before any bids)')) return;
  try {
    await api(`/auctions/${auctionId}/cancel`, { method: 'POST' });
    showToast('Listing withdrawn.', 'success');
    loadAuction();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function startPayment() {
  const btn = document.getElementById('pay-btn');
  if (btn) { btn.textContent = 'Preparing payment…'; btn.disabled = true; }
  try {
    const payConfig = await api('/payments/config');
    const order = await api(`/payments/create-order/${auctionId}`, { method: 'POST' });

    if (!payConfig.razorpay_enabled || order.stub) {
      await api('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: order.order_id,
          razorpay_payment_id: 'pay_stub_' + Date.now(),
          razorpay_signature: 'stub',
          auction_id: auctionId,
        }),
      });
      showToast('Test payment recorded! Add Razorpay keys for live payments.', 'info');
      document.getElementById('alert').innerHTML = `<div class="alert alert-success">✓ Payment recorded (test mode). Seller will contact you for delivery.</div>`;
      return;
    }

    const options = {
      key: payConfig.key_id,
      amount: order.amount,
      currency: order.currency,
      name: 'AnyBid',
      description: auctionData?.title || 'Auction payment',
      order_id: order.order_id,
      handler: async (response) => {
        await api('/payments/verify', { method: 'POST', body: JSON.stringify({ ...response, auction_id: auctionId }) });
        showToast('Payment successful! 🎉', 'success');
        document.getElementById('alert').innerHTML = `<div class="alert alert-success">✓ Payment successful! The seller will contact you for delivery.</div>`;
        if (btn) { btn.textContent = 'Payment complete ✓'; btn.disabled = true; }
      },
      modal: {
        ondismiss: async () => {
          await api('/payments/fail', { method: 'POST', body: JSON.stringify({ razorpay_order_id: order.order_id, auction_id: auctionId, error_description: 'User closed payment window' }) }).catch(() => {});
          if (btn) { btn.textContent = '💳 Complete payment via Razorpay'; btn.disabled = false; }
        }
      },
      prefill: { email: getUser()?.email || '' },
      theme: { color: '#1e1b4b' },
    };
    new window.Razorpay(options).open();
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) { btn.textContent = '💳 Complete payment via Razorpay'; btn.disabled = false; }
  }
}

loadAuction().catch((e) => {
  document.getElementById('content').innerHTML = `<div class="alert alert-error">${e.message}</div>`;
});
