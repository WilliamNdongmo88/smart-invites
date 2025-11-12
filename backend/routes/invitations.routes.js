const express = require('express');
const router = express.Router();
const InvitationController = require('../controllers/invitation.controller');
const { authenticateToken, requireRole } = require('../middlewares/jwtFilter');

router.post('/generate/:guestId', authenticateToken, requireRole('admin'), InvitationController.genererInvitation);
router.post('/generate-several', authenticateToken, requireRole('admin'), InvitationController.genererSeveralInvitations);
router.get("/view/:guestId", InvitationController.viewInvitation);
router.get("/qrcode/view/:guestId", InvitationController.viewQrCode);
router.put("/rsvp-status/:token", InvitationController.rsvpGuestStatus);
router.delete("/delete/:guestId", InvitationController.deleteInvitation);


module.exports = router;