const express = require('express');
const router = express.Router();
const GuestController = require('../controllers/guest.controller');
const { authenticateToken, requireRole } = require('../middlewares/jwtFilter');

router.post('/add-guest',authenticateToken, requireRole('admin'), GuestController.addGuest);
router.get('/all-guests',authenticateToken, GuestController.getAllGuest);
router.get('/:guestId',authenticateToken, GuestController.getGuest);
router.get('/event/:eventId',authenticateToken, GuestController.getGuestsByEvent);
router.put('/:guestId',authenticateToken, GuestController.updateGuest);
router.put('/rsvp/:guestId',authenticateToken, GuestController.updateRsvpStatus);
router.delete('/:guestId',authenticateToken, GuestController.deleteGuest);

module.exports = router;