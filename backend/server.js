const { startServer } = require('./app');
const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

knex.migrate.latest()
    .then(() => console.log("🚀 Migrations applied"))
    .catch(err => console.error(err));


startServer().catch(err => {
  console.error("Erreur fatale lors du démarrage du serveur:", err);
  process.exit(1);
});