const mysql = require('mysql2/promise');
require('dotenv').config({
  path: process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env'
});

const isTest = process.env.NODE_ENV;
console.log('isTest:', isTest);
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3308,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'dev-root',
  database: process.env.MYSQL_DATABASE || 'dev_smart_invite_db',
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
  timezone: 'Z',
});

console.log("📌 Connected to DB:", process.env.MYSQLDATABASE);
console.log('✅ Pool MySQL initialisé.');

module.exports = pool;
