require('dotenv').config();
const pool = require('../config/bd');

// Initialisation du modèle Payments
const initPaymentModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS PAYMENTS (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      organizer_id INT UNSIGNED NOT NULL,
      file_url TEXT,
      file_type VARCHAR(100),
      code VARCHAR(100),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES USERS(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Table PAYMENTS prête !');
};

async function createPaymentProof(organizerId, fileUrl, fileType, code) {
  const [result] = await pool.query(`
      INSERT INTO PAYMENTS (organizer_id, file_url, file_type, code) VALUES(?,?,?,?)
    `,[organizerId, fileUrl, fileType, code]);

  return result;
};

async function getPaymentProof(organizerId) {
  const [result] = await pool.query(`
      SELECT *
      FROM PAYMENTS
      WHERE organizer_id=?
  `,[organizerId]);

  return result[0];
};

async function updatePaymentProof(id, organizerId, fileUrl, fileType, code) {
  const [result] = await pool.query(`
    UPDATE PAYMENTS 
    SET organizer_id=?,
        file_url=?,
        file_type=?,
        code=?
    WHERE id=?
  `, [organizerId, fileUrl, fileType, code, id]);

  return result.insertId;
}

module.exports = {
    initPaymentModel,
    createPaymentProof,
    getPaymentProof,
    updatePaymentProof
}