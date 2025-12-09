const express = require('express');
const router = express.Router();

router.get("/", async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).json({ error: "Missing image URL" });
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.set("Content-Type", response.headers.get("content-type"));

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error("Image proxy error:", error);
    res.status(500).json({ error: "Failed to load image" });
  }
});

module.exports = router;
