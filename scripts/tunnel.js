const localtunnel = require('localtunnel');

(async () => {
  const port = process.env.PORT || 3000;
  const tunnel = await localtunnel({ port });
  console.log('PUBLIC_URL=' + tunnel.url);
  console.log(`AnyBid is LIVE at ${tunnel.url}`);
  tunnel.on('close', () => console.log('Tunnel closed'));
})();
