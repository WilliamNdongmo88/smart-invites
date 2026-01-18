const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/feedback.controller.js');

router.post('/feedback', FeedbackController.addFeedback);
router.get('/feedback/stats', FeedbackController.fetchFeedbackStats);
router.get('/feedback/recent', FeedbackController.fetchRecentFeedback);

module.exports = router;