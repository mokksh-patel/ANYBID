/** Simple India zone shipping estimator (INR) */
function estimateShipping({ weightKg = 0.5, pincode = '' }) {
  const w = Math.max(0.1, Number(weightKg) || 0.5);
  let base = 49;
  if (w > 1) base += Math.ceil(w - 1) * 25;
  if (w > 5) base += Math.ceil(w - 5) * 40;

  const pin = String(pincode || '').replace(/\D/g, '');
  if (pin.length === 6) {
    const first = parseInt(pin[0], 10);
    if ([8, 9].includes(first)) base += 80;
    else if ([7].includes(first)) base += 50;
    else if ([6].includes(first)) base += 30;
  }

  return {
    amount: Math.round(base),
    currency: 'INR',
    note: 'Estimated; final cost confirmed by seller',
  };
}

module.exports = { estimateShipping };
