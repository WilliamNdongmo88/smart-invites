require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {sendEmailCode, checkUserByCode, resetUserPassword} = require('../services/auth.service');
const {
  createUser,
  getUserByFk,
  getUserByEmail,
  getUserById,
  saveResetCode,
  saveRefreshToken,
  clearRefreshToken
} = require('../models/users');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

const getMe = async (req, res, next) => {
  try {
    const user = await getUserByFk(req.user.id);
    if(!user) return res.json({message: "Utilisateur non trouvé"})
    return res.json({id: user.id, name: user.name, email: user.email})
  } catch (error) {
    console.error('GET ME ERROR:', error.message);
    next(error);
  }
}

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

    const userId = await createUser({ name, email, password, role });
    res.status(201).json({ id: userId, name, email });
  } catch (error) {
    console.error('REGISTER ERROR:', error.message);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    console.log("---Body---: ", req.body)
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await getUserByEmail(email);
    console.log("---user---: ", user)
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    await saveRefreshToken(user.id, refreshToken);

    // Envoi de la réponse JSON vers Angular
    return res.status(200).json({
      message: 'Connexion réussie ✅',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error.message);
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Vérifie si l’utilisateur existe
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé!' });
    }

    // Génère un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Sauvegarde le code temporairement en base (avec date d’expiration)
    await saveResetCode(user.id, code);

    // Envoie du mail via Brevo
    await sendEmailCode(user, code);

    return res.status(200).json({ message: 'Code de vérification envoyé par email' });

  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error.message);
    next(error);  }
};

const checkCode = async (req, res, next) => {
    try {
        console.log("---Body---: ", req.body)
        const { email, code } = req.body;

        // Vérification si le code est correct
        const user = await checkUserByCode(email, code);

        return res.status(200).json({ message: 'Code valide', userId: user.id });
    } catch (error) {
        console.error('CHECK CODE ERROR:', error.message);
        next(error);
    }
}

const resetPassword = async (req, res, next) => {
    try {
        console.log("---Body---: ", req.body)
        const { email, newpassword } = req.body;

        const user = await resetUserPassword(email, newpassword);
        console.log("---user---: ", user.id);
        return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès', userId: user.id });
    } catch (error) {
        console.error('RESET PASSWORD ERROR:', error.message);
        next(error);
    }
}

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token requis' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Refresh token invalide' });
    }

    const user = await getUserById(payload.id);
    if (!user || !user.refresh_token) return res.status(401).json({ error: 'Refresh token inconnu' });
    if (user.refresh_token !== refreshToken) return res.status(401).json({ error: 'Refresh token mismatch' });

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id });

    // remplace l'ancien refresh token
    await saveRefreshToken(user.id, newRefreshToken);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('REFRESH ERROR:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
    next(error);
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token requis' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Refresh token invalide' });
    }

    await clearRefreshToken(payload.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('LOGOUT ERROR:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
    // next(error);
  }
};

module.exports = { register, login, refresh, logout, getMe, forgotPassword, checkCode, resetPassword };