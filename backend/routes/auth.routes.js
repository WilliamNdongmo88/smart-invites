const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middlewares/jwtFilter');
const {loginLimiter} = require('../middlewares/rateLimiter')
const AuthController = require('../controllers/auth.controller');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Gestion de l'authentification
 */
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Récupérer l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeResponse'
 *       401:
 *         description: Identifiants invalides
 */
router.get('/me', authenticateToken, AuthController.getMe );

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Création d’un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegister'
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Email déjà existant ou validation échouée
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion d’un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLogin'
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Identifiants invalides
 */
router.post('/login', loginLimiter, AuthController.login);
router.post('/refresh-token', AuthController.refresh);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/check-code', AuthController.checkCode);
router.post('/reset-password', AuthController.resetPassword);
router.post('/add-guest', AuthController.register);

module.exports = router ;