const pool = require('../config/bd');

const initLinkModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS LINKS (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      event_id INT UNSIGNED NOT NULL,
      type VARCHAR(255),
      token VARCHAR(255),
      used_count INT NOT NULL DEFAULT 0,
      limit_count INT NOT NULL,
      link VARCHAR(500),
      FOREIGN KEY (event_id) REFERENCES EVENTS(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Table LINKS prête !');
};

async function createLink(eventId, type, token, limitCount, link) {
  const [result] = await pool.query(`
      INSERT INTO LINKS (event_id, type, token, limit_count, link)
      VALUES(?,?,?,?,?)
  `,[eventId, type, token, limitCount, link]);

  return result;
}

async function getAllLinks() {
  const [result] = await pool.query(`SELECT * FROM LINKS`);

  return result;
}

async function getLinkByToken(token) {
  const [result] = await pool.query(`
      SELECT *
      FROM LINKS
      WHERE token=?
  `,[token]);

  return result[0];
}

async function updateLink(linkId, usedCount) {
  const [result] = await pool.query(`
    UPDATE LINKS 
    SET used_count=?
    WHERE id=?
  `, [usedCount, linkId]);

  return result.insertId;
}

async function deleteAllLink() {
    await pool.query(`DELETE FROM LINKS`);
}

module.exports = {initLinkModel, createLink, getAllLinks, getLinkByToken, updateLink, deleteAllLink}