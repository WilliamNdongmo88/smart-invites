const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite de 5 essais par IP
  message: {
    error: "Trop de tentatives de connexion. Réessayez plus tard."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requêtes / minute / IP
  message: {
    error: "Trop de requêtes. Patientez un moment."
  }
});

module.exports = {
  loginLimiter,
  apiLimiter,
};
