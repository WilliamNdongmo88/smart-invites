const Brevo = require('@getbrevo/brevo');
require('dotenv').config();
const {getUserByEmail, updateUserPassword, updateUserActiveAccount} = require('../models/users')

// Fonction utilitaire pour envoyer le mail via Brevo
async function sendEmailCode(user, code, isActive=false) {
  const brevo = new Brevo.TransactionalEmailsApi();
  brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

  const resetPassMessage = `
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
  const activeAccountMessage = `
      <div style="font-family:Arial,sans-serif">
        <h2>Bonjour ${user.name || ''},</h2>
        <p>Voici votre code d'activation :</p>
        <h1 style="letter-spacing:4px">${code}</h1>
        <p>Ce code est valable pendant 10 minutes.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.</p>
        <br/>
        <p>L’équipe <strong>Smart Invite</strong></p>
      </div>
    `

  const sendSmtpEmail = {
    to: [{ email: user.email, name: user.name }],
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Smart Invite' },
    subject: isActive ? 'Activation de votre compte': 'Réinitialisation de votre mot de passe',
    htmlContent: isActive ? activeAccountMessage : resetPassMessage
  };

  await brevo.sendTransacEmail(sendSmtpEmail);
  console.log(`✅ Email envoyé à ${user.email}`);
}

async function sendCredentialToUser(user) {
  const brevo = new Brevo.TransactionalEmailsApi();
  brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

  const htmlContent = `
  <div style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
            style="background:#ffffff;border-radius:8px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

            <!-- Header -->
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h2 style="margin:0;color:#2c3e50;">
                  ✅ Bienvenue sur Smart Invite
                </h2>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="color:#444;font-size:15px;line-height:1.6;">
                <p>Bonjour <strong>${user.name}</strong>,</p>

                <p>
                  Votre compte <strong>Smart Invite</strong> a été créé avec succès 🎉.
                </p>

                <p>Voici vos informations de connexion :</p>

                <!-- Credentials box -->
                <div style="
                  background:#f8fafc;
                  border:1px solid #e5e7eb;
                  border-radius:6px;
                  padding:15px;
                  margin:15px 0;
                ">
                  <p style="margin:5px 0;"><strong>Email :</strong> ${user.email}</p>
                  <p style="margin:5px 0;"><strong>Mot de passe temporaire :</strong> ${user.password}</p>
                </div>

                <p>
                  ⚠️ Pour votre sécurité, nous vous recommandons de modifier votre mot de passe
                  après votre première connexion.
                </p>

                <div style="text-align:center;margin:25px 0;">
                  <a href="${process.env.API_URL}/login"
                    style="
                      background:#2c3e50;
                      color:#ffffff;
                      padding:12px 22px;
                      text-decoration:none;
                      border-radius:5px;
                      font-weight:bold;
                    ">
                    Se connecter
                  </a>
                </div>

                <p>
                  Cordialement,<br/>
                  <strong>L’équipe Smart Invite</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center"
                  style="padding-top:25px;font-size:12px;color:#888;border-top:1px solid #eee;">
                © ${new Date().getFullYear()} Smart Invite — Tous droits réservés
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  const sendSmtpEmail = {
    to: [{ email: user.email, name: user.name }],
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Smart Invite' },
    subject: 'Comptes et identifiants de connexion',
    htmlContent: htmlContent
  };

  await brevo.sendTransacEmail(sendSmtpEmail);
  console.log(`✅ Email envoyé à ${user.email}`);
}

async function sendNotificationToAdmin(user) {
  const brevo = new Brevo.TransactionalEmailsApi();
  brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

  const htmlContent = `
  <div style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
            style="background:#ffffff;border-radius:8px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

            <!-- Header -->
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h2 style="margin:0;color:#2c3e50;">
                  🎉 Nouvel abonné sur Smart Invite
                </h2>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="color:#444;font-size:15px;line-height:1.6;">
                <p>Bonjour <strong>${process.env.ADMIN_NAME || 'Administrateur'}</strong>,</p>

                <p>
                  Un nouvel utilisateur vient de s’inscrire sur votre plateforme 
                  <strong>Smart Invite</strong>.
                </p>

                <p>Voici ses informations de base :</p>

                <!-- Infos box -->
                <div style="
                  background:#f8fafc;
                  border:1px solid #e5e7eb;
                  border-radius:6px;
                  padding:15px;
                  margin:15px 0;
                ">
                  <!-- Exemple champs -->
                  <p style="margin:5px 0;"><strong>Nom :</strong> ${user.name}</p>
                  <p style="margin:5px 0;"><strong>Email :</strong> ${user.email}</p>
                </div>

                <p>
                  Vous pouvez consulter les détails complets depuis votre tableau de bord administrateur.
                </p>

                <p style="margin-top:25px;">
                  Cordialement,<br/>
                  <strong>L’équipe Smart Invite</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center"
                  style="padding-top:25px;font-size:12px;color:#888;border-top:1px solid #eee;">
                © ${new Date().getFullYear()} Smart Invite — Tous droits réservés
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
`;

  const sendSmtpEmail = {
    to: [{ email: process.env.ADMIN_EMAIL, name: process.env.ADMIN_NAME }],
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Smart Invite' },
    subject: 'Nouvel utilisateur créé',
    htmlContent: htmlContent
  };

  await brevo.sendTransacEmail(sendSmtpEmail);
  console.log(`✅ Email envoyé à ${user.email}`);
}

async function checkUserByCode(email, code, isActive=false) {
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
  if(isActive) await updateUserActiveAccount(email, true);
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

module.exports = {
  sendEmailCode, 
  checkUserByCode, 
  resetUserPassword, 
  sendNotificationToAdmin,
  sendCredentialToUser
};