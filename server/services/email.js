const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const tx = getTransporter();
  const adminCopy = process.env.ADMIN_EMAIL || 'mokkshpatel@gmail.com';
  const recipients = Array.isArray(to) ? to : [to];

  if (!tx) {
    console.log('[email stub]', { to: recipients, subject, text: text || html?.slice(0, 120) });
    return { stub: true };
  }

  await tx.sendMail({
    from: process.env.SMTP_FROM || `"AnyBid" <${process.env.SMTP_USER}>`,
    to: recipients.join(', '),
    bcc: adminCopy,
    subject,
    html,
    text,
  });
  return { sent: true };
}

async function notifyOutbid({ user, auction, newAmount }) {
  return sendMail({
    to: user.email,
    subject: `Outbid on "${auction.title}" — AnyBid`,
    html: `<p>Hi ${user.name},</p>
      <p>Someone placed a higher bid of <strong>${auction.currency} ${newAmount}</strong> on <strong>${auction.title}</strong>.</p>
      <p><a href="${baseUrl()}/auction.html?id=${auction.id}">Bid again</a> before time runs out!</p>
      <p>— AnyBid · Bid on anything. Win everything.</p>`,
    text: `You were outbid on ${auction.title}. New bid: ${newAmount}.`,
  });
}

async function notifyWinner({ winner, seller, auction, commission }) {
  const amount = auction.current_bid;
  return sendMail({
    to: [winner.email, seller.email],
    subject: `You won "${auction.title}" — AnyBid`,
    html: `<p>Congratulations ${winner.name}!</p>
      <p>You won <strong>${auction.title}</strong> for <strong>${auction.currency} ${amount}</strong>.</p>
      <p>Platform commission (${commission}%): ${auction.currency} ${((amount * commission) / 100).toFixed(2)}</p>
      <p>Seller: ${seller.name} (${seller.email})</p>
      <p>Complete payment: <a href="${baseUrl()}/auction.html?id=${auction.id}">Pay with Razorpay</a></p>
      <p>— AnyBid</p>`,
  });
}

async function notifyNoSale({ seller, auction }) {
  return sendMail({
    to: seller.email,
    subject: `Auction ended — floor not met: "${auction.title}"`,
    html: `<p>Hi ${seller.name},</p>
      <p>Your auction <strong>${auction.title}</strong> ended without reaching the floor price of ${auction.currency} ${auction.floor_price}.</p>
      <p>No sale was made — your item remains yours.</p>`,
  });
}

function baseUrl() {
  return process.env.APP_URL || 'http://localhost:3000';
}

module.exports = { sendMail, notifyOutbid, notifyWinner, notifyNoSale };
