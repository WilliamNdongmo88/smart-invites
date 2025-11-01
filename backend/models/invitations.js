require('dotenv').config();
const pool = require('../config/bd');

const initInvitationModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS INVITATIONS (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guest_id INT NOT NULL,
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

    const [result] = await pool.query(`INSERT INTO INVITATIONS (guest_id, token, qr_code_url, expires_at) 
        VALUES(?,?,?,?)`, [guestId, token, qrCodeUrl, expiresAt]);
    return result.insertId;
};

async function getGuestInvitationById(guestId) {
    const guest = await pool.query(`SELECT * FROM INVITATIONS WHERE guest_id=?`, [guestId]);
    return guest[0];
};

async function getGuestInvitationByToken(token) {
    const guest = await pool.query(`SELECT * FROM INVITATIONS WHERE token=?`, [token]);
    return guest[0];
};

async function deleteGuestInvitation(guestId) {
    await pool.query(`DELETE FROM INVITATIONS WHERE guest_id=?`, [guestId]);
};

module.exports = {initInvitationModel, createInvitation, getGuestInvitationById, 
    getGuestInvitationByToken, deleteGuestInvitation
};