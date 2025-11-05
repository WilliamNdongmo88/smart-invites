require('dotenv').config();
const pool = require('../config/bd');

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
        has_plus_one BOOLEAN NOT NULL DEFAULT FALSE,
        foot_restriction BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES USERS(id) ON DELETE CASCADE,
        CONSTRAINT valid_status CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED'))
    )
  `);
  console.log('✅ Table EVENTS prête !');
};

async function createEvent(organizerId, title, description, eventDate, 
            eventLocation, maxGuests, hasPlusOne, footRestriction, status) {
    const [result] = await pool.query(`INSERT INTO EVENTS (organizer_id, title, description, 
        event_date, event_location, max_guests,has_plus_one, foot_restriction, status) VALUES(?,?,?,?,?,?,?,?,?)`,
    [organizerId, title, description, eventDate, eventLocation, maxGuests, hasPlusOne, footRestriction, status]);
    return result.insertId;
}

async function getEventWithTotalGuest() {
        const result = await pool.query(`
        SELECT
            e.id AS event_id,
            e.title,
            e.description,
            e.event_date,
            e.event_location,
            e.max_guests,
            e.status,
            COUNT(g.id) AS total_guests,
            SUM(CASE WHEN g.rsvp_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
            SUM(CASE WHEN g.rsvp_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN g.rsvp_status = 'DECLINED' THEN 1 ELSE 0 END) AS declined_count
        FROM EVENTS e
        LEFT JOIN GUESTS g ON g.event_id = e.id
        GROUP BY e.id
    `
    );
    return result[0];
}

async function getEventById(eventId) {
    const [event] = await pool.query(`SELECT * FROM EVENTS WHERE id = ?`, [eventId]);
    return event[0];
}

async function getEventsByOrganizerId(organizerId) {
    const [event] = await pool.query(`
        SELECT 
            e.id AS event_id,
            e.title,
            e.description,
            e.event_date,
            e.event_location,
            e.max_guests,
            e.status,
            COUNT(g.id) AS total_guests,
            SUM(CASE WHEN g.rsvp_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
            SUM(CASE WHEN g.rsvp_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN g.rsvp_status = 'DECLINED' THEN 1 ELSE 0 END) AS declined_count
        FROM EVENTS e
        LEFT JOIN GUESTS g ON g.event_id = e.id
        WHERE organizer_id = ?
        GROUP BY e.id
    `, [organizerId]);
    console.log("event: ", event);
    return event;
}

async function getEventWithTotalGuestById(eventId) {
    const result = await pool.query(`
        SELECT
            e.id AS event_id,
            e.title,
            e.description,
            e.event_date,
            e.event_location,
            e.max_guests,
            e.status,
            COUNT(g.id) AS total_guests,
            SUM(CASE WHEN g.rsvp_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
            SUM(CASE WHEN g.rsvp_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN g.rsvp_status = 'DECLINED' THEN 1 ELSE 0 END) AS declined_count
        FROM EVENTS e
        LEFT JOIN GUESTS g ON g.event_id = e.id
        WHERE e.id = ?
        GROUP BY e.id
    `, [eventId]
    );
    return result[0];
}

async function updateEvent(eventId, events) {
    const {
        organizerId,
            title,
            description,
            eventDate,
            eventLocation,
            maxGuests,
            hasPlusOne, footRestriction,
            status
    } = events
    await pool.query(`UPDATE EVENTS SET organizer_id=?, title=?, description=?, event_date=?, 
        event_location=?, max_guests=?,has_plus_one=?, foot_restriction=?, status=? WHERE id=?`, [organizerId, title, description, eventDate, 
            eventLocation, maxGuests,hasPlusOne, footRestriction, status, eventId]);
}

async function updateEventStatus(eventId, status) {
    await pool.query(`UPDATE EVENTS SET status=? WHERE id=?`, [status, eventId]);
}

async function deleteEvents(eventId) {
    await pool.query(`DELETE FROM EVENTS WHERE id = ?`, [eventId]);
}

module.exports = {
    initEventsModel, createEvent, updateEvent,updateEventStatus,
    getEventById, getEventsByOrganizerId,deleteEvents,
    getEventWithTotalGuestById, getEventWithTotalGuest
};