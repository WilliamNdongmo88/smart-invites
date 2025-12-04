const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives de connexion." }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes." }
});

// Middleware qui ne fait rien (désactive tout rate-limit)
const noRateLimit = (req, res, next) => next();

module.exports = {
  loginLimiter,
  apiLimiter,
  noRateLimit,
};
