require('dotenv').config();
const pool = require('../config/bd');
const bcrypt = require('bcryptjs');

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

module.exports = {initEventsModel};