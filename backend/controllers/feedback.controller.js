const { createFeedback, getFeedbackStats, getRecentFeedback } = require("../models/feedbacks");

const addFeedback = async (req, res, next) => {
  try {
    const { rating, category, title, message, email } = req.body;
    const result = await createFeedback(rating, category, title, message, email);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.log('[addFeedback] Error:', err.message);
    next(err);
  }
};

const fetchFeedbackStats = async (req, res, next) => {
  try {
    const stats = await getFeedbackStats();
    res.json(stats);
  } catch (err) {
    console.log('[fetchFeedbackStats] Error:', err.message);
    next(err);
  }
};

const fetchRecentFeedback = async (req, res, next) => {
  try {
    const data = await getRecentFeedback();
    res.json(data);
  } catch (err) {
    console.log('[fetchRecentFeedback] Error:', err.message);
    next(err);
  }
};

module.exports = { addFeedback, fetchFeedbackStats, fetchRecentFeedback };