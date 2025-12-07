const pool = require('../config/bd');

const initLinkModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS LINKS (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(255),
        token VARCHAR(255),
        used_count INT NOT NULL DEFAULT 0,
        limit_count INT NOT NULL,
        link VARCHAR(500)
    )
  `);
  console.log('✅ Table LINKS prête !');
};

async function createLink(type, token, limitCount, link) {
  const [result] = await pool.query(`
      INSERT INTO LINKS (type, token, limit_count, link)
      VALUES(?,?,?,?)
  `,[type, token, limitCount, link]);

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

module.exports = {initLinkModel, createLink, getLinkByToken, updateLink}