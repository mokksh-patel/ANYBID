require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

console.log('Resetting marketplace data...');
execSync('node scripts/seed-marketplace.js', {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env: process.env,
});
