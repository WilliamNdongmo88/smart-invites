require('dotenv').config();
const pool = require('../config/bd');

const initGuestModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS GUESTS (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone_number VARCHAR(20),
        rsvp_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        has_plus_one BOOLEAN NOT NULL DEFAULT false,
        plus_one_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES EVENTS(id) ON DELETE CASCADE,
        CONSTRAINT valid_rsvp_status CHECK (rsvp_status IN ('PENDING', 'CONFIRMED', 'DECLINED'))
    )
  `);
  console.log('✅ Table GUESTS prête !');
};

async function createGuest(eventId, fullName, email, phoneNumber, 
            rsvpStatus, hasPlusOne, plusOneName, notes) {
    const [result] = await pool.query(`INSERT INTO GUESTS (event_id, full_name, email, phone_number, 
        rsvp_status, has_plus_one, plus_one_name, notes) VALUES(?,?,?,?,?,?,?,?)`, 
        [eventId, fullName, email, phoneNumber, rsvpStatus, hasPlusOne, plusOneName, notes]);
    console.log("result :: ", result.insertId);
    return result.insertId;
}

async function getGuestById(id) {
    const [event] = await pool.query(`SELECT * FROM GUESTS WHERE id=?`, [id]);
    return event[0];
}

async function getGuestByEventId(eventId) {
    const [event] = await pool.query(`SELECT * FROM GUESTS WHERE event_id=?`, [eventId]);
    return event;
}

async function update_guest(guestId, eventId, fullName, email, phoneNumber, 
            rsvpStatus, hasPlusOne, plusOneName, notes) {
    await pool.query(`UPDATE GUESTS SET event_id=?, full_name=?, email=?, phone_number=?, 
        rsvp_status=?, has_plus_one=?, plus_one_name=?, notes=? WHERE id=?`, 
        [eventId, fullName, email, phoneNumber, rsvpStatus, hasPlusOne, plusOneName, notes, guestId]
    );
}

async function updateRsvpStatusGuest(guestId, rsvpStatus) {
    await pool.query(`UPDATE GUESTS SET rsvp_status=? WHERE id=?`, [rsvpStatus, guestId]);
}

async function delete_guest(guestId) {
    await pool.query(`DELETE FROM GUESTS WHERE id=?`, [guestId]);
}

module.exports = {initGuestModel, createGuest, getGuestById,
    getGuestByEventId, update_guest, updateRsvpStatusGuest, delete_guest,
}