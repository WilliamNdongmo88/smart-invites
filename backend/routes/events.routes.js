const express = require('express');
const router = express.Router();
const EventController = require('../controllers/event.controller');
const { authenticateToken, requireRole } = require('../middlewares/jwtFilter');

router.post('/create-event',authenticateToken, requireRole('admin'), EventController.create_Event);
router.get('/:eventId',authenticateToken, EventController.getEventBy_Id);
router.get('/organizer/:organizerId',authenticateToken, EventController.getOrganizerEvents);
router.put('/:eventId',authenticateToken, EventController.updateEventBy_Id);
router.put('/status/:eventId',authenticateToken, EventController.updateEvent_Status);
router.delete('/:eventId',authenticateToken, EventController.deleteEvent);

module.exports = router;