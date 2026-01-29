require('dotenv').config();
const pool = require('../config/bd');
const bcrypt = require('bcryptjs');

// Initialisation du modèle User
const initUserModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS USERS (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      phone VARCHAR(20),
      bio TEXT,
      avatar_url TEXT,
      email_notifications BOOLEAN NOT NULL DEFAULT FALSE,
      attendance_notifications BOOLEAN NOT NULL DEFAULT TRUE,
      thank_notifications BOOLEAN NOT NULL DEFAULT TRUE,
      event_reminders BOOLEAN NOT NULL DEFAULT FALSE,
      marketing_emails BOOLEAN NOT NULL DEFAULT FALSE,
      refresh_token TEXT,
      reset_code VARCHAR(6),
      reset_code_expires DATETIME,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP
    )
  `);
  console.log('✅ Table USERS prête !');
};

// Create default user
async function createDefaultAdmin() {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM USERS WHERE role = 'admin' LIMIT 1"
        );

        if (rows.length > 0) {
            console.log("Admin already exists");
            return;
        }
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        await pool.query(
            "INSERT INTO USERS (name, email, password, role) VALUES (?, ?, ?, ?)",
            [process.env.ADMIN_NAME ,process.env.ADMIN_EMAIL, hashedPassword, "admin"]
        );

        console.log("---Default admin created successfully---");
    } catch (error) {
        console.error("Error creating default admin:", error.message);
    }
}

async function createUser({ name, email, password, role = 'user', isActive = false, avatar_url = null }) {
  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO USERS (name, email, password, role, is_active, avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, hashed, role, isActive, avatar_url]
  );
  return result.insertId;
}

async function getUserByFk(id) {
  const [user] = await pool.query(`SELECT * FROM USERS WHERE id=?`, [id]);
  return user.length ? user[0] : null;
}

async function getUsers() {
  const [user] = await pool.query(`SELECT * FROM USERS`);
  return user.length ? user : null;
}

async function getUserByEmail(email) {
  const [rows] = await pool.query(`SELECT * FROM USERS WHERE email = ?`, [email]);
  return rows.length ? rows[0] : null;
}

async function getUserById(id) {
  const [rows] = await pool.query(`SELECT * FROM USERS WHERE id = ?`, [id]);
  return rows.length ? rows[0] : null;
}

async function saveResetCode(userId, code) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await pool.query(
    'UPDATE USERS SET reset_code = ?, reset_code_expires = ? WHERE id = ?',
    [code, expiresAt, userId]
  );
}

async function updateUserPassword(email, newpassword) {
    const hashedPassword = await bcrypt.hash(newpassword, 10);
    await pool.query(`UPDATE USERS SET password = ? WHERE email = ?`, [hashedPassword, email]);
}

async function updateUserActiveAccount(email, isActive) {
    await pool.query(`UPDATE USERS SET is_active = ? WHERE email = ?`, [isActive, email]);
}

async function saveRefreshToken(userId, token) {
  await pool.query(`UPDATE USERS SET refresh_token = ? WHERE id = ?`, [token, userId]);
}

async function clearRefreshToken(userId) {
  await pool.query(`UPDATE USERS SET refresh_token = NULL WHERE id = ?`, [userId]);
}

async function updateUser(userId, updatedUser) {
    const [result] = await pool.query(`
      UPDATE USERS SET name=?, email=?, phone=?, bio=?, avatar_url=?, 
      email_notifications=?, attendance_notifications=?, thank_notifications=?, event_reminders=?, marketing_emails=?
      WHERE id=?
  `, [  
      updatedUser.name,
      updatedUser.email,
      updatedUser.phone,
      updatedUser.bio,  
      updatedUser.avatar_url,
      updatedUser.email_notifications,  
      updatedUser.attendance_notifications,  
      updatedUser.thank_notifications,  
      updatedUser.event_reminders,  
      updatedUser.marketing_emails,  
      userId
  ]);

  return userId;
}

async function deleteAccount(userId) {
    await pool.query(`DELETE FROM USERS WHERE id = ?`, [userId]);
}

module.exports = {
    initUserModel, 
    createDefaultAdmin, 
    createUser,
    getUsers,
    updateUser, 
    getUserByFk,
    saveResetCode,
    getUserByEmail,
    getUserById,
    saveRefreshToken,
    updateUserPassword,
    clearRefreshToken,
    deleteAccount,
    updateUserActiveAccount
}