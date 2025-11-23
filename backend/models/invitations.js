require('dotenv').config();
const pool = require('../config/bd');

const initInvitationModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS INVITATIONS (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        guest_id INT UNSIGNED UNIQUE,
        token VARCHAR(255) NOT NULL UNIQUE,
        qr_code_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        expires_at TIMESTAMP,
        used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guest_id) REFERENCES GUESTS(id) ON DELETE CASCADE,
        CONSTRAINT valid_invitation_status CHECK (status IN ('ACTIVE', 'USED', 'EXPIRED'))
    )
  `);
  console.log('✅ Table INVITATIONS prête !');
};

async function createInvitation(guestId, token, qrCodeUrl) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const [result] = await pool.execute(`INSERT INTO INVITATIONS (guest_id, token, qr_code_url, expires_at) 
        VALUES(?,?,?,?)`, [guestId, token, qrCodeUrl, expiresAt]);
    return result.insertId;
};

async function getInvitationById(invitationId) {
    const result = await pool.query(`SELECT * FROM INVITATIONS WHERE id=?`, [invitationId]);
    return result[0];
};

async function getGuestByInvitationId(invitationId) {
    const [result] = await pool.execute(`
        SELECT 
            i.id AS invitationId,
            i.used_at AS usedAt,
            g.id AS guestId,
            g.full_name AS name,
            g.plus_one_name AS plusOneName,
            g.rsvp_status AS rsvpStatus
        FROM INVITATIONS i
        LEFT JOIN GUESTS g ON g.id=i.guest_id
        WHERE i.id=?
    `,[invitationId]);

    return result[0];
}

async function getGuestInvitationById(guestId) {
    const result = await pool.query(`SELECT * FROM INVITATIONS WHERE guest_id=?`, [guestId]);
    return result[0];
};

async function getGuestInvitationByToken(token) {
    const result = await pool.query(`SELECT * FROM INVITATIONS WHERE token=?`, [token]);
    return result[0];
};

async function updateInvitationById(invitationId, status, usedAt) {
    //console.log('variable:', {invitationId, status, usedAt});
    const [result] = await pool.query(`UPDATE INVITATIONS SET status=?, used_at=?, updated_at=? WHERE id=?`,
        [status, usedAt, usedAt, invitationId]
    );
    return result[0];
}

async function deleteGuestInvitation(guestId) {
    await pool.query(`DELETE FROM INVITATIONS WHERE guest_id=?`, [guestId]);
};

module.exports = {initInvitationModel, getInvitationById, createInvitation, getGuestByInvitationId,
    getGuestInvitationById, getGuestInvitationByToken, updateInvitationById, deleteGuestInvitation
};