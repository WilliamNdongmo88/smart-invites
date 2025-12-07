const express = require('express');
const router = express.Router();
const LinkController = require('../controllers/link.controller');
const { authenticateToken, requireRole } = require('../middlewares/jwtFilter');

router.post('/add-link', authenticateToken, LinkController.addLink);

module.exports = router;