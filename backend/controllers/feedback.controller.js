const { createFeedback, getFeedbackStats, getRecentFeedback, updateStatusFeedback } = require("../models/feedbacks");
const { getUserByEmail } = require("../models/users");

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

const getAllUsers = async (req, res, next) => {
  try {
    const datas = req.body;
    //console.log('datas ::', datas);
    const users = [];
    for (const data of datas) {
        const user = await getUserByEmail(data.email);
        if(!user){
            console.log(`User with email ${data.email} not found.`);
            continue;
        }
        users.push(user.email);
    }
    //console.log('users ::', users);
    res.json(users);
  } catch (err) {
    console.log('[getAllUsers] Error:', err.message);
    next(err);
  }
};

const changeStatusFeedback = async (req, res, next) => {
    try {
      console.log('req.body ::', req.body);
        const {status} = req.body;
        await updateStatusFeedback(req.params.id, status);
        return res.status(200).json({ message: "Statut du feedback mis à jour avec succès !" });
    } catch (error) {
        console.log('[changeStatusFeedback] Error:', error.message);
        next(error);
    }
}

module.exports = { addFeedback, 
                   fetchFeedbackStats, 
                   fetchRecentFeedback,
                   changeStatusFeedback,
                   getAllUsers
                };