const API = '/api';

function getToken() {
  return localStorage.getItem('anybid_token');
}

function setToken(token) {
  if (token) localStorage.setItem('anybid_token', token);
  else localStorage.removeItem('anybid_token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('anybid_user') || 'null');
  } catch {
    return null;
  }
}

function setUser(user) {
  if (user) localStorage.setItem('anybid_user', JSON.stringify(user));
  else localStorage.removeItem('anybid_user');
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function formatMoney(amount, currency = 'INR') {
  const sym = { INR: '₹', USD: '$', EUR: '€' }[currency] || currency + ' ';
  return `${sym}${Number(amount).toLocaleString('en-IN')}`;
}

function formatTimer(seconds) {
  if (seconds <= 0) return 'ENDED';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function updateHeaderAuth() {
  const user = getUser();
  const loginEl = document.getElementById('nav-login');
  const userEl = document.getElementById('nav-user');
  const adminEl = document.getElementById('nav-admin');
  if (!loginEl) return;
  if (user) {
    loginEl.style.display = 'none';
    if (userEl) {
      userEl.style.display = 'inline-flex';
      userEl.textContent = user.name;
      userEl.href = '/dashboard.html';
    }
    if (adminEl) adminEl.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
  } else {
    loginEl.style.display = 'inline-flex';
    if (userEl) userEl.style.display = 'none';
    if (adminEl) adminEl.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', updateHeaderAuth);
