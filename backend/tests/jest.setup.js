
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.test' });

const dbConfig = {
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
};

console.log('dbConfig:', dbConfig);
const TEST_DB_NAME = process.env.MYSQLDATABASE;

// Connexion sans spécifier de base de données pour créer/supprimer la base de données de test
let connection;

// beforeAll(async () => {
//   // 1. Connexion au serveur MySQL
//   connection = await mysql.createConnection(dbConfig);
  
//   // 2. Suppression de la base de données de test si elle existe
//   await connection.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
  
//   // 3. Création de la base de données de test
//   await connection.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  
//   // 4. Connection à la nouvelle base de données de test
//   await connection.changeUser({ database: TEST_DB_NAME });
  
//   // 5. Fermeture de la connexion temporaire utilisée pour la création de la DB
//   await connection.end();
// });
beforeAll(async () => {
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
  });
  console.log('connection:', connection);

  await connection.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
  await connection.query(`CREATE DATABASE ${TEST_DB_NAME}`);

  await connection.end();

  process.env.MYSQLDATABASE = TEST_DB_NAME;

  jest.resetModules(); // 🔥 très important
});


afterAll(async () => {
  // 1. Recréation d'une connexion pour supprimer la base de données
  const connectionAfter = await mysql.createConnection(dbConfig);
  await connectionAfter.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
  await connectionAfter.end();
});
