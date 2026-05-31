require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function main() {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'anybid',
    password: process.env.DB_PASSWORD || 'anybid_secret',
    multipleStatements: true,
  };

  let conn;
  try {
    conn = await mysql.createConnection({ ...config, database: undefined });
    const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    await conn.query(schema);

    const db = await mysql.createConnection({
      ...config,
      database: process.env.DB_NAME || 'anybid',
    });

    const adminEmail = process.env.ADMIN_EMAIL || 'mokkshpatel@gmail.com';
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (!rows.length) {
      const hash = await bcrypt.hash('Admin@123', 10);
      await db.query(
        'INSERT INTO users (email, password_hash, name, role, verified) VALUES (?, ?, ?, ?, 1)',
        [adminEmail, hash, 'AnyBid Admin', 'admin']
      );
      console.log(`Admin created: ${adminEmail} / Admin@123 (change password after login)`);
    } else {
      console.log('Admin already exists:', adminEmail);
    }
    await db.end();
    console.log('Database ready.');
  } catch (err) {
    console.error('DB init failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
