const errorHandler = (err, req, res, next) => {
  console.error("🔥 Global Error:", err.stack || err.message);

  return res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Erreur interne du serveur",
  });
};

module.exports = errorHandler;
