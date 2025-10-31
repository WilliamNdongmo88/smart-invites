const express = require('express');
const router = express.Router();
const InvitationController = require('../controllers/invitation.controller');
const { authenticateToken, requireRole } = require('../middlewares/jwtFilter');

router.post('/create-invitation/:guestId',authenticateToken, requireRole('admin'), InvitationController.genererInvitation);
router.get('/qrcode/view/:token', authenticateToken, InvitationController.viewQrCode);

module.exports = router;