const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middlewares/jwtFilter');
const {loginLimiter} = require('../middlewares/rateLimiter')
const AuthController = require('../controllers/auth.controller');

router.get('/me', authenticateToken, AuthController.getMe );
router.post('/register', AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/refresh-token', AuthController.refresh);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/check-code', AuthController.checkCode);
router.post('/reset-password', AuthController.resetPassword);
router.post('/add-guest', AuthController.register);

module.exports = router ;