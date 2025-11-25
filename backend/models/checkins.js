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
  console.log('✅ Table CHECKINS prête !');
};


async function createCheckin(eventId, invitationId, scannedBy, scanStatus, checkinTime) {
    const safeEventId = eventId ?? null;// Pour éviter les undefined
    const safeInvitationId = invitationId ?? null;
    const safeScannedBy = scannedBy ?? null;
    const safeScanStatus = scanStatus ?? null;
    const safeCheckinTime = checkinTime ? new Date(checkinTime) : new Date();

    const [result] = await pool.query(
        `INSERT INTO CHECKINS (event_id, invitation_id, scanned_by, scan_status, checkin_time)
         VALUES (?, ?, ?, ?, ?)`,
        [safeEventId, safeInvitationId, safeScannedBy, safeScanStatus, safeCheckinTime]
    );

    return result.insertId;
}

async function getCheckinByInvitationId(invitationId) {
  const [result] = await pool.query(`SELECT * FROM CHECKINS WHERE invitation_id=?`,[invitationId]);
  return result[0];
}

async function getGuestsCheckIns() {
  const [result] = await pool.query(`SELECT * FROM CHECKINS`);
  return result;
}

async function updateCheckin(checkinId, eventId, invitationId, scannedBy, scanStatus, checkinTime) {
  const [result] = await pool.query(`
    UPDATE CHECKINS 
    SET event_id=?, invitation_id=?, scanned_by=?, scan_status=?, checkin_time=?
    WHERE id=?
  `,[eventId, invitationId, scannedBy, scanStatus, checkinTime, checkinId]);

  return result.insertId;
}

module.exports = {initCheckinModel, createCheckin, getGuestsCheckIns, getCheckinByInvitationId, updateCheckin};