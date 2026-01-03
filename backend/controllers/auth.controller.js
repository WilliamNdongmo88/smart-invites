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
  clearRefreshToken,
  updateUser,
  deleteAccount
} = require('../models/users');
const { create } = require('qrcode');
const { getEventsByOrganizerId, deleteEvents } = require('../models/events');
const { getGuestByEventId, getGuestAndInvitationRelatedById, delete_guest } = require('../models/guests');
const { deleteGuestFiles } = require('../services/invitation.service');
const { sendMailToAdmin } = require('../services/notification.service');
const { createUserNews, getUserNewsByEmail, updateUserNews } = require('../models/usernews');

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
    return res.json({
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      phone: user.phone, 
      bio: user.bio, 
      avatar_url: user.avatar_url,
      email_notifications: user.email_notifications,
      attendance_notifications: user.attendance_notifications,
      thank_notifications: user.thank_notifications,
      event_reminders: user.event_reminders,
      marketing_emails: user.marketing_emails,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    });
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

const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, bio, avatar_url,
            email_notifications, attendance_notifications,
            thank_notifications, event_reminders,
            marketing_emails } = req.body;
        const user = await getUserByFk(req.params.userId);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        const updatedUser = {
            name: name || user.name,
            phone: phone || user.phone,
            bio: bio || user.bio,
            avatar_url: avatar_url || user.avatar_url,
            email_notifications: email_notifications !== undefined ? email_notifications : user.email_notifications,
            attendance_notifications: attendance_notifications !== undefined ? attendance_notifications : user.attendance_notifications,
            thank_notifications: thank_notifications !== undefined ? thank_notifications : user.thank_notifications,
            event_reminders: event_reminders !== undefined ? event_reminders : user.event_reminders,
            marketing_emails: marketing_emails !== undefined ? marketing_emails : user.marketing_emails
        };

        const result = await updateUser(req.params.userId, updatedUser);
        return res.status(200).json({ message: 'Utilisateur mis à jour avec succès' });
    } catch (error) {
        console.error('UPDATE USER ERROR:', error.message);
        next(error);
    }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await getUserByEmail(email);
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

const loginWithGoogle = async (req, res, next) => {
  try {
    const { tokenId } = req.body;
    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID requis' });
    }
    // Vérification du token avec Google
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log('GOOGLE PAYLOAD:', payload);

    const { email, name, sub: googleId, picture } = payload;
    console.log('Extracted Google user info:', { email, name, googleId, picture });
    // Ici, tu peux créer ou mettre à jour l’utilisateur dans ta DB
    
    let user = await getUserByEmail(email);
    console.log('user info:', user);
    if (!user) {
      // Crée un nouvel utilisateur si non existant
      const name = payload.name;
      const randomPassword = Math.random().toString(36).slice(-8);
      const userId = await createUser({ 
        name, email, password: randomPassword, role: 'user', avatar_url: picture 
      });
      user = await getUserById(userId);
    }
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });
    await saveRefreshToken(user.id, refreshToken);
    return res.status(200).json({
      message: 'Connexion Google réussie ✅',
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
    console.error('GOOGLE LOGIN ERROR:', error.message);
    next(error);
  }
};

const contactUs = async (req, res, next) => {
  try {
    console.log("Body: ", req.body);
    const {name, email, phone, subject, message, newsletter} = req.body;
    if(newsletter){
      const usernews = await getUserNewsByEmail(email);
      if(usernews){
        console.log("Utilisateur déjà existant.");
        await updateUserNews(usernews.id, name, email, phone, usernews.newsletter);
        await sendMailToAdmin(name, email, phone, subject, message);
        return res.status(200).json({success: "Message envoyé avec succès"});
      }
      await createUserNews(name, email, phone, newsletter);
      await sendMailToAdmin(name, email, phone, subject, message);
      return res.status(200).json({success: "Message envoyé avec succès"});
    }else{
      await sendMailToAdmin(name, email, phone, subject, message);
      return res.status(200).json({success: "Message envoyé avec succès"});
    }
  } catch (err) {
    console.error("ContactUs ERROR:", err.message);
    next(err);
  }
}

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Vérifie si l’utilisateur existe
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé !' });
    }

    // Génère un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Sauvegarde le code temporairement en base (avec date d’expiration)
    await saveResetCode(user.id, code);

    // Envoie du mail via Brevo
    try {
      await sendEmailCode(user, code);
      res.status(200).json({ message: 'Email envoyé' });
    } catch (error) {
      console.error("SEND EMAIL ERROR:", error.message);
      next(error);
    }

    return res.status(200).json({ message: 'Code de vérification envoyé par email' });

  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error.message);
    next(error);  }
};

const checkCode = async (req, res, next) => {
    try {
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
        const { email, newpassword } = req.body;

        const user = await resetUserPassword(email, newpassword);
        return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès', userId: user.id });
    } catch (error) {
        console.error('RESET PASSWORD ERROR:', error.message);
        next(error);
    }
}

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Champs requis manquants'
      });
    }

    const currentUser = await getUserById(req.params.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const match = await bcrypt.compare(currentPassword, currentUser.password);
    if (!match) return res.status(400).json({ error: "Le mot de passe actuel est incorrect" });

    const user = await resetUserPassword(currentUser.email, newPassword);

    return res.status(200).json({
      message: 'Mot de passe réinitialisé avec succès',
      userId: user.id
    });

  } catch (error) {
    console.error('[updatePassword] ERROR:', error.message);
    next(error);
  }
};


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

const deleteProfile = async (req, res, next) => {
    try {
        const user = await getUserById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        const events = await getEventsByOrganizerId(req.params.userId);
        if (events.length > 0) {
            //console.log('USER EVENTS:', events);
            for (const event of events) {
              const guests = await getGuestByEventId(event.event_id);
              if (guests.length > 0) {
                //console.log('EVENTS GUESTS:', guests);
                for (const g of guests) {
                  const guest = await getGuestAndInvitationRelatedById(g.id);
                  if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
                  await delete_guest(guest.guest_id);
                  if(guest.invitationId) {
                    //console.log('Deleting files for guest ID:', guest.guest_id);
                    await deleteGuestFiles(guest.guest_id, guest.invitationToken);
                  }
                  //console.log(`Guest with ID ${guest.guest_id} and related invitations deleted.`);
                }
              }
              await deleteEvents(event.event_id);
              //console.log(`Event with ID ${event.event_id} deleted.`);
            }
        }
        await deleteAccount(req.params.userId);
        //console.log(`User with ID ${req.params.userId} deleted.`);
        return res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error('DELETE USER ERROR:', error.message);
        next(error);
    }
};

module.exports = { register, login, loginWithGoogle, refresh, logout, updatePassword,
  getMe, contactUs, forgotPassword, checkCode, resetPassword, updateProfile, deleteProfile };