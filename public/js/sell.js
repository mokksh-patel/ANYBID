if (!getToken()) location.href = '/login.html';

document.getElementById('listing-type').addEventListener('change', (e) => {
  const isEstate = e.target.value === 'real_estate';
  document.getElementById('estate-fields').style.display = isEstate ? 'block' : 'none';
  document.getElementById('weight-group').style.display = isEstate ? 'none' : 'block';
});

api('/auctions/meta').then((meta) => {
  const cat = document.getElementById('category-select');
  meta.categories.forEach((c) => {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    cat.appendChild(o);
  });
  const cur = document.getElementById('currency-select');
  meta.currencies.forEach((c) => {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    if (c === 'INR') o.selected = true;
    cur.appendChild(o);
  });
});

document.getElementById('sell-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/auctions', { method: 'POST', body: fd });
    location.href = `/auction.html?id=${data.id}`;
  } catch (err) {
    document.getElementById('alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
});
