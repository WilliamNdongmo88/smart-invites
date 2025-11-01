const express = require('express');
const router = express.Router();
const InvitationController = require('../controllers/invitation.controller');
const { authenticateToken, requireRole } = require('../middlewares/jwtFilter');

router.post('/generate/:guestId', authenticateToken, requireRole('admin'), InvitationController.genererInvitation);
router.get("/view/:guestId", InvitationController.viewInvitation);
router.get("/qrcode/view/:guestId", authenticateToken, InvitationController.viewQrCode);

module.exports = router;