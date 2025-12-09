const express = require('express');
const cors = require('cors');
const pool = require('./config/bd')
const {initModels} = require('./models');
const {createDefaultAdmin} = require('./models/users')
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/events.routes');
const guestRoutes = require('./routes/guests.routes');
const invitationRoutes = require('./routes/invitations.routes');
const checkinRoutes = require('./routes/checkin.routes');
const notificationRoutes = require('./routes/notification.routes');
const linkRoutes = require('./routes/link.routes');
const errorHandler = require('../backend/middlewares/errorHandler');
const { apiLimiter, noRateLimit } = require('./middlewares/rateLimiter');
const setupSwagger = require('./docs/swagger');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV === "production") {
  app.set('trust proxy', 1); // obligatoire pour Railway / Render / Vercel
}
app.use("/api/invitation/view", noRateLimit);
app.use(apiLimiter);

// Autorise les requêtes venant d'Angular
app.use(cors({
  origin: process.env.API_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/invitation', invitationRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/link', linkRoutes);
app.get('/api/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).send('URL de l\'image manquante');
  }

  try {
    // Le backend télécharge l'image
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream'
    });

    // On renvoie l'image au client (frontend)
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);

  } catch (error) {
    console.error("Erreur lors de la récupération de l'image via le proxy :", error);
    res.status(500).send('Erreur interne du serveur');
  }
});

app.use(errorHandler);

setupSwagger(app); 

let server; // Stocke l'instance du serveur HTTP

const startServer = async () => {
  try {
    // 1 Vérifier la connexion à MySQL
    const [rows] = await pool.query('SELECT NOW() AS now');
    console.log('🕐 MySQL test query result:', rows[0]);
    // 2 Initialiser toutes les tables
    await initModels();
    await createDefaultAdmin();

    // 3 Démarrer le serveur
    app.get('/', (req, res) => {
      res.send('🚀 Node.js + MySQL connectés et initialisés !');
    });

    server = app.listen(PORT, () => {
      console.log(`✅ Serveur lancé sur ${process.env.BASE_URL}`);
      console.log("✅ BASE_URL:: ", process.env.BASE_URL);
      console.log("✅ API_URL:: ", process.env.API_URL);
    });
    return server; // Retourne l'instance du serveur
  } catch (err) {
    console.error('❌ Erreur au démarrage :', err.message);
    throw err; 
  }
};

const closeServer = async () => {
  try {
    if (server) {
      await new Promise(resolve => server.close(resolve));
      console.log('✅ Serveur HTTP fermé');
    }
    // Fermer le pool de connexions
    await pool.end();
    console.log('✅ Pool MySQL fermé');
  } catch (err) {
    console.error('❌ Erreur lors de la fermeture du serveur/pool MySQL :', err.message);
    throw err;
  }
};

// L'appel de startServer() n'est pas faite ici pour permettre à Jest de contrôler le démarrage.
module.exports = { app, startServer, closeServer, pool }; 

