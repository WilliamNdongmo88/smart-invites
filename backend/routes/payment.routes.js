const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authenticateToken } = require('../middlewares/jwtFilter');

router.post('/change/:userId', authenticateToken, PaymentController.changeUserPlan);

module.exports = router;