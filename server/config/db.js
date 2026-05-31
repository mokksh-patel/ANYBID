const mysql = require('mysql2/promise');

function getConfig() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
  if (url) {
    return { uri: url, connectionLimit: 10, waitForConnections: true };
  }

  return {
    host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER || process.env.DB_USER || 'anybid',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'anybid_secret',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'anybid',
    waitForConnections: true,
    connectionLimit: 10,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
}

const pool = mysql.createPool(getConfig());

module.exports = pool;
