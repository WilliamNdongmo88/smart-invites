const Brevo = require('@getbrevo/brevo');
require('dotenv').config();
const {getUserByEmail, updateUserPassword} = require('../models/users')

// Fonction utilitaire pour envoyer le mail via Brevo
async function sendEmailCode(user, code) {
  const brevo = new Brevo.TransactionalEmailsApi();
  brevo.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

  const sendSmtpEmail = {
    to: [{ email: user.email, name: user.name }],
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Smart Invite' },
    subject: 'Réinitialisation de votre mot de passe',
    htmlContent: `
      <div style="font-family:Arial,sans-serif">
        <h2>Bonjour ${user.name || ''},</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Voici votre code de vérification :</p>
        <h1 style="letter-spacing:4px">${code}</h1>
        <p>Ce code est valable pendant 10 minutes.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.</p>
        <br/>
        <p>L’équipe <strong>Smart Invite</strong></p>
      </div>
    `
  };

  await brevo.sendTransacEmail(sendSmtpEmail);
  console.log(`✅ Email envoyé à ${user.email}`);
}

async function checkUserByCode(email, code) {
  // Recherche l'utilisateur
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Vérifie si un code est enregistré
  if (!user.reset_code) {
    throw new Error('Aucun code de vérification n’a été généré pour cet utilisateur');
  }

  // Compare le code fourni
  console.log("[checkUserByCode] reset_code : ", user.reset_code);
  console.log("[checkUserByCode] code : ", code);
  if (user.reset_code !== code) {
    throw new Error('Code de vérification invalide');
  }

  // Vérifie la date d’expiration
  const now = new Date();
  const expiresAt = new Date(user.reset_code_expires);

  if (expiresAt < now) {
    throw new Error('Le code de vérification a expiré');
  }

  // Si tout est bon, retourne l’utilisateur
  return user;
}

async function resetUserPassword(email, newpassword) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('###[resetUserPassword] Utilisateur non trouvé');
  }
  await updateUserPassword(email, newpassword);
  const userUpdate = await getUserByEmail(email);
  return userUpdate;
}

module.exports = {sendEmailCode, checkUserByCode, resetUserPassword};