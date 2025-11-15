const Brevo = require('@getbrevo/brevo');
require('dotenv').config();

async function sendGuestEmail(guest, event, token) {
  const brevo = new Brevo.TransactionalEmailsApi();
  brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();
  const rsvpLink = `${process.env.API_URL}/invitations/${token}`;

  const sendSmtpEmail = {
    to: [{ email: guest.email, name: guest.full_name }],
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Smart Invite' },
    subject: `🎉 Invitation au ${event.event_title}`,
    htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; background-color: #fff; padding: 20px; border-radius: 8px; margin: auto;">
                <h2 style="text-align: center; color: #D4AF37;">💍 Vous êtes invité au ${event.event_title}</h2>
                <p style="font-size: 16px; color: #333;">
                    Bonjour <strong>${guest.full_name}</strong>,
                </p>
                <p style="font-size: 16px; color: #333;">
                    Nous avons le plaisir de vous inviter à célébrer notre union le 
                    <strong>${new Date(event.event_date).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric"
                    })}</strong>
                    au <strong>${event.event_location}</strong>.
                </p>
                <p style="font-size: 16px; color: #333;">
                    Pour confirmer votre présence, merci de mettre à jour votre réponse (RSVP) en cliquant sur le bouton ci-dessous :
                </p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${rsvpLink}" 
                    style="background-color: #D4AF37; color: white; padding: 12px 24px; border-radius: 6px; 
                            text-decoration: none; font-weight: bold;">
                    ✅ Confirmer ma présence
                    </a>
                </div>
                <p style="font-size: 14px; color: #666;">
                    Si le bouton ne fonctionne pas, vous pouvez aussi copier ce lien dans votre navigateur :
                </p>
                <p style="font-size: 14px; color: #555; word-break: break-all;">
                    <a href="${rsvpLink}" target="_blank">${rsvpLink}</a>
                </p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 13px; color: #888; text-align: center;">
                    Merci et à très bientôt 💖<br>
                    ${event.event_title.split('de')[1]}
                </p>
            </div>
        </div>
    `
  };

  await brevo.sendTransacEmail(sendSmtpEmail);
  console.log(`✅ Email envoyé à ${guest.email}`);
};

module.exports = {sendGuestEmail};