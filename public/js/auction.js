const params = new URLSearchParams(location.search);
const auctionId = params.get('id');
if (!auctionId) location.href = '/';

let auctionData = null;
let eventSource = null;

async function loadAuction() {
  const { auction, bids } = await api(`/auctions/${auctionId}`);
  auctionData = auction;
  render(auction, bids);
  connectStream();
}

function render(auction, bids) {
  const user = getUser();
  const isSeller = user && user.id === auction.seller_id;
  const isWinner = user && auction.winner_id === user.id;
  const canBid = auction.status === 'active' && user && !isSeller;
  const img = auction.image_path
    ? `<img src="${auction.image_path}" alt="" />`
    : '<span style="font-size:4rem">📦</span>';

  document.title = `${auction.title} — AnyBid`;
  document.getElementById('content').innerHTML = `
    <article class="auction-detail">
      <div class="detail-image">${img}</div>
      <div>
        <span class="badge ${auction.listing_type === 'real_estate' ? 'estate' : ''}">${auction.category}</span>
        <h1 style="margin:0.5rem 0">${escapeHtml(auction.title)}</h1>
        ${auction.property_location ? `<p>📍 ${escapeHtml(auction.property_location)}${auction.property_area_sqft ? ` · ${auction.property_area_sqft} sq ft` : ''}</p>` : ''}
        <p style="color:var(--muted);margin:0.5rem 0">${escapeHtml(auction.description || '')}</p>
        <div class="seller-trust">Seller: <strong>${escapeHtml(auction.seller_name)}</strong>
          ${auction.seller_rating ? `<span class="stars">★ ${auction.seller_rating}</span>` : ''}
        </div>
        <p class="countdown" id="countdown">--:--</p>
        <p class="countdown-label">Time left · BidRush: last 60s bids extend timer</p>
        <p class="price" style="font-size:1.5rem;margin-top:0.5rem">
          ${formatMoney(auction.current_bid || auction.starting_bid, auction.currency)}
          <small>current bid · ${auction.bid_count} bids</small>
        </p>
        <div class="floor-info">
          <strong>FAIR floor:</strong> Sale only happens at <strong>${formatMoney(auction.floor_price, auction.currency)}</strong> or above.
          Starting bid: ${formatMoney(auction.starting_bid, auction.currency)}.
        </div>
        <p class="commission-note" id="shipping-estimate"></p>
        ${
          canBid
            ? `<form class="bid-form" id="bid-form">
            <input type="number" id="bid-amount" step="0.01" placeholder="Your bid" required />
            <button type="submit" class="btn btn-primary">Place bid</button>
          </form>`
            : ''
        }
        ${isSeller && auction.status === 'active' && auction.bid_count === 0 ? `<button class="btn btn-danger" id="cancel-btn" style="margin-top:1rem">Withdraw listing</button>` : ''}
        ${isWinner && auction.status === 'sold' ? `<button class="btn btn-primary btn-block" id="pay-btn" style="margin-top:1rem">Pay with Razorpay</button>` : ''}
        <p id="status-msg" style="margin-top:1rem"></p>
      </div>
    </article>
    <section class="bid-history auth-card" style="margin-top:1.5rem;max-width:100%">
      <h3>Transparent bid history</h3>
      <table>
        <thead><tr><th>Bidder</th><th>Amount</th><th>Time</th></tr></thead>
        <tbody id="bid-rows">
          ${bids.length ? bids.map((b) => `<tr><td>${escapeHtml(b.bidder_name)}</td><td>${formatMoney(b.amount, auction.currency)}</td><td>${new Date(b.created_at).toLocaleString()}</td></tr>`).join('') : '<tr><td colspan="3">No bids yet — be the first!</td></tr>'}
        </tbody>
      </table>
    </section>`;

  if (canBid) {
    document.getElementById('bid-form').addEventListener('submit', placeBid);
  }
  if (document.getElementById('cancel-btn')) {
    document.getElementById('cancel-btn').addEventListener('click', cancelListing);
  }
  if (document.getElementById('pay-btn')) {
    document.getElementById('pay-btn').addEventListener('click', startPayment);
  }

  updateStatus(auction);
  loadShipping(auction);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function updateStatus(auction) {
  const el = document.getElementById('status-msg');
  if (!el) return;
  const map = {
    active: '<span class="alert alert-info">Auction is LIVE</span>',
    sold: '<span class="alert alert-success">SOLD — winner must complete payment</span>',
    no_sale: '<span class="alert alert-error">Ended — floor price not met. No sale.</span>',
    cancelled: '<span class="alert alert-error">Listing cancelled</span>',
    ended: '<span class="alert alert-error">Auction ended</span>',
  };
  el.innerHTML = map[auction.status] || '';
}

async function loadShipping(auction) {
  if (auction.listing_type === 'real_estate') return;
  try {
    const est = await api(`/auctions/shipping-estimate?weightKg=${auction.shipping_weight_kg || 0.5}`);
    const el = document.getElementById('shipping-estimate');
    if (el) el.textContent = `Estimated shipping: ₹${est.amount} (${est.note})`;
  } catch {}
}

function connectStream() {
  if (eventSource) eventSource.close();
  eventSource = new EventSource(`/api/auctions/${auctionId}/stream`);
  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    const cd = document.getElementById('countdown');
    if (cd) {
      cd.textContent = formatTimer(data.seconds_left);
      cd.classList.toggle('live', data.seconds_left > 0 && data.seconds_left <= 60);
    }
    if (auctionData) {
      auctionData.current_bid = data.current_bid;
      auctionData.bid_count = data.bid_count;
      auctionData.status = data.status;
      auctionData.ends_at = data.ends_at;
    }
    if (data.status !== 'active') {
      loadAuction();
    }
  };
}

async function placeBid(e) {
  e.preventDefault();
  if (!getToken()) return (location.href = '/login.html');
  const amount = document.getElementById('bid-amount').value;
  try {
    const res = await api(`/bids/${auctionId}`, {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount) }),
    });
    document.getElementById('alert').innerHTML = `<div class="alert alert-success">${res.message}</div>`;
    loadAuction();
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function cancelListing() {
  if (!confirm('Withdraw this listing? (Only possible before any bids)')) return;
  await api(`/auctions/${auctionId}/cancel`, { method: 'POST' });
  loadAuction();
}

async function startPayment() {
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
    document.getElementById('alert').innerHTML =
      '<div class="alert alert-success">Test payment recorded. Add Razorpay keys in .env for live payments.</div>';
    return;
  }

  const options = {
    key: payConfig.key_id,
    amount: order.amount,
    currency: order.currency,
    name: 'AnyBid',
    description: auctionData.title,
    order_id: order.order_id,
    handler: async (response) => {
      await api('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({ ...response, auction_id: auctionId }),
      });
      document.getElementById('alert').innerHTML =
        '<div class="alert alert-success">Payment successful!</div>';
    },
    prefill: { email: getUser()?.email || '' },
    theme: { color: '#2874f0' },
  };
  new Razorpay(options).open();
}

loadAuction().catch((e) => {
  document.getElementById('content').innerHTML = `<div class="alert alert-error">${e.message}</div>`;
});
