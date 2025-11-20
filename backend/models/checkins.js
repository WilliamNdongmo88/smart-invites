require('dotenv').config();
const pool = require('../config/bd');

const initCheckinModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS CHECKINS (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        event_id INT UNSIGNED NOT NULL,
        invitation_id INT UNSIGNED NOT NULL,
        scanned_by VARCHAR(255),
        device_id VARCHAR(255),
        scan_status VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        checkin_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES EVENTS(id) ON DELETE CASCADE,
        FOREIGN KEY (invitation_id) REFERENCES INVITATIONS(id) ON DELETE CASCADE,
        CONSTRAINT valid_scan_status CHECK (scan_status IN ('VALID', 'INVALID', 'DUPLICATE', 'EXPIRED'))
    )
  `);
  console.log('✅ Table GUESTS prête !');
};

async function createCheckin(eventId, invitationId, scannedBy, scanStatus, checkinTime) {
    const [result] = await pool.query(`INSERT INTO CHECKINS (event_id, invitation_id, scanned_by, 
        scan_status, checkin_time) VALUES(?,?,?,?,?)`, [eventId, invitationId, scannedBy, scanStatus, checkinTime]);
    return result.insertId;
}

module.exports = {initCheckinModel, createCheckin};