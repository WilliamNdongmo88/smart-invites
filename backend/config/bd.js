const mysql = require('mysql2/promise');
require('dotenv').config({
  path: process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env'
});

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  port: process.env.MYSQLPORT || 3308,
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'dev-root',
  database: process.env.MYSQLDATABASE || 'test_smart_invite_db',
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
  timezone: 'Z',
});

console.log("📌 Connected to DB:", process.env.MYSQLDATABASE);
console.log('✅ Pool MySQL initialisé.');

module.exports = pool;
