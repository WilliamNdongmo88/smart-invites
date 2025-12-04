const pool = require('../config/bd');

const initLinkModel = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS LINKS (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(255),
        used_count INTEGER NOT NULL,
        limit_count INTEGER NOT NULL,
        is_single BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
  console.log('✅ Table LINKS prête !');
};

async function createLink(token, usedCount, isSingle) {
    const [result] = await pool.query(`
        INSERT INTO LINKS (token, used_count, is_single)
        VALUES(?,?,?)
    `,[token, usedCount, isSingle]);

    return result.insertId;
}

module.exports = {initLinkModel, createLink}