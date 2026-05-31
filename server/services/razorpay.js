const Razorpay = require('razorpay');
const crypto = require('crypto');

let instance;

function getRazorpay() {
  if (instance) return instance;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.includes('xxxxxxxx')) {
    return null;
  }
  instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return instance;
}

async function createOrder({ amountPaise, currency, receipt, notes }) {
  const rzp = getRazorpay();
  if (!rzp) {
    return {
      id: `order_stub_${Date.now()}`,
      amount: amountPaise,
      currency: currency || 'INR',
      stub: true,
    };
  }
  return rzp.orders.create({
    amount: amountPaise,
    currency: currency || 'INR',
    receipt,
    notes,
  });
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || secret.includes('xxxxxxxx')) return true;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

module.exports = { getRazorpay, createOrder, verifyPaymentSignature };
