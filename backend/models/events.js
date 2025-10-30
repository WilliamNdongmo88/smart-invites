require('dotenv').config();
const pool = require('../config/bd');

// Initialisation du modèle User
const initEventsModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS EVENTS (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organizer_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date TIMESTAMP NOT NULL,
        event_location VARCHAR(255),
        max_guests INTEGER,
        status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES USERS(id) ON DELETE CASCADE,
        CONSTRAINT valid_status CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED'))
    )
  `);
  console.log('✅ Table USERS prête !');
};

async function createEvent(organizerId, title, description, eventDate, 
            eventLocation, maxGuests, status) {
    const [result] = await pool.query(`INSERT INTO EVENTS (organizer_id, title, description, 
        event_date, event_location, max_guests, status) VALUES(?,?,?,?,?,?,?)`,
    [organizerId, title, description, eventDate, eventLocation, maxGuests, status]);
    return result.insertId;
}

async function getEventById(eventId) {
    const [event] = await pool.query(`SELECT * FROM EVENTS WHERE id = ?`, [eventId]);
    return event[0];
}

async function getEventsByOrganizerId(organizerId) {
    const [event] = await pool.query(`SELECT * FROM EVENTS WHERE organizer_id = ?`, [organizerId]);
    console.log("event: ", event);
    return event;
}

async function updateEvent(eventId, events) {
    const {
        organizerId,
            title,
            description,
            eventDate,
            eventLocation,
            maxGuests,
            status
    } = events
    await pool.query(`UPDATE EVENTS SET organizer_id=?, title=?, description=?, event_date=?, 
        event_location=?, max_guests=?, status=? WHERE id=?`, [organizerId, title, description, eventDate, 
            eventLocation, maxGuests, status, eventId]);
}

async function updateEventStatus(eventId, status) {
    await pool.query(`UPDATE EVENTS SET status=? WHERE id=?`, [status, eventId]);
}

async function deleteEvents(eventId) {
    await pool.query(`DELETE FROM EVENTS WHERE id = ?`, [eventId]);
}

module.exports = {
    initEventsModel, createEvent, updateEvent,updateEventStatus,
    getEventById, getEventsByOrganizerId,deleteEvents
};