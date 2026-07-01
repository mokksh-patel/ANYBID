if (!getToken()) location.href = '/login.html';

// Duration toggle
document.querySelectorAll('.duration-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('duration-val').value = btn.dataset.val;
  });
});

// Listing type toggle
document.getElementById('listing-type').addEventListener('change', (e) => {
  const isEstate = e.target.value === 'real_estate';
  document.getElementById('estate-fields').style.display = isEstate ? 'block' : 'none';
  document.getElementById('weight-group').style.display  = isEstate ? 'none'  : 'block';
});

// Image preview
document.getElementById('image-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById('image-preview');
  const img = document.getElementById('preview-img');
  if (file) {
    img.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
});

// Load meta
api('/auctions/meta').then((meta) => {
  document.getElementById('commission-pct').textContent = meta.commissionPercent;
  const cat = document.getElementById('category-select');
  meta.categories.forEach((c) => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c; cat.appendChild(o);
  });
  const cur = document.getElementById('currency-select');
  meta.currencies.forEach((c) => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    if (c === 'INR') o.selected = true;
    cur.appendChild(o);
  });
});

// Submit
document.getElementById('sell-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Publishing…'; btn.disabled = true;
  const fd = new FormData(e.target);
  try {
    const data = await api('/auctions', { method: 'POST', body: fd });
    showToast('Listing published! Redirecting…', 'success');
    setTimeout(() => location.href = `/auction.html?id=${data.id}`, 800);
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    btn.textContent = '🚀 Start auction'; btn.disabled = false;
  }
});
