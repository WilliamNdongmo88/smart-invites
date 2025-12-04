module.exports = (err, req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); 
  }
  console.error("🔥 Global Error:", err.stack || err.message);

  return res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Erreur interne du serveur",
  });
};