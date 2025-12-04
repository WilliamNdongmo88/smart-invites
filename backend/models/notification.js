const pool = require('../config/bd');

const initNotificationModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        message TEXT,
        type VARCHAR(255),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table NOTIFICATIONS prête !');
};

async function createNotification(title, message, type, isRead) {
    const [result] = await pool.query(`
        INSERT INTO NOTIFICATIONS (title, message, type, is_read)
        VALUES(?,?,?,?)
    `,[title, message, type, isRead]);

    return result.insertId;
}

async function getNotifications() {
    const [result] = await pool.query(`SELECT * FROM NOTIFICATIONS`);
    return result[0] ?? null; // si vide → null
}

async function updateNotif(notificationId, read) {
    const [result] = await pool.query(`UPDATE NOTIFICATIONS SET read=? WHERE id=?`, [notificationId, read]);
    return result[0];
}

async function deleteNotif(notificationId) {
    await pool.query(`DELETE FROM NOTIFICATIONS WHERE id=?`, [notificationId]);
}

module.exports = {initNotificationModel, createNotification, getNotifications, updateNotif, deleteNotif}