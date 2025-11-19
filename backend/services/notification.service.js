const Brevo = require('@getbrevo/brevo');
const axios = require('axios');
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
  console.log(`✅ Email(Invitation) envoyé à ${guest.email}`);
};

async function sendInvitationToGuest(guest, qrCodeUrl) {
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

    // 1 Télécharger l’image du QR code sous forme de binaire
    const qrResponse = await axios.get(qrCodeUrl, {
        responseType: "arraybuffer",
    });

    // 2 La convertir en base64
    const qrBase64 = Buffer.from(qrResponse.data).toString("base64");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color:#d63384;">💖 Merci d'avoir confirmé votre présence au mariage !</h2>

        <p>Bonjour <strong>${guest.full_name}</strong>,</p>

        <p>
          Nous sommes ravis que vous ayez accepté notre invitation à notre mariage.
          Votre présence compte énormément pour nous ❤️.
        </p>

        <p>
          Vous trouverez ci-joint votre <strong>QR-code d’accès</strong> que vous pourrez
          présenter le jour de l’événement.
        </p>

        <p>
          Si vous avez des questions, n’hésitez surtout pas à nous contacter.
        </p>

        <p style="margin-top:20px;">À très bientôt,</p>
        <p><strong>Les futurs mariés 💍</strong></p>
      </div>
    `;

    const sendSmtpEmail = {
      sender: { name: "Smart Invite", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: guest.email, name: guest.full_name }],
      subject: "🎉 Merci d'avoir confirmé votre présence !",
      htmlContent,
      attachment: [
        {
          name: "qr-code-mariage.png",
          content: qrBase64
        }
      ]
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email(qr-code) envoyé à ${guest.email}`);
}

async function sendReminderMail(guest, event) {
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();
    const rsvpLink = `${process.env.API_URL}/invitations/${event.invitationToken}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; background-color: #fff; padding: 20px; border-radius: 8px; margin: auto;">
            
            <h2 style="text-align: center; color: #D4AF37;">🔔 Rappel de confirmation</h2>

            <p style="font-size: 16px; color: #333;">
            Bonjour <strong>${guest.full_name}</strong>,
            </p>

            <p style="font-size: 16px; color: #333;">
            Nous espérons que vous allez bien.  
            Vous aviez été invité(e) à l’événement 
            <strong>${event.eventTitle}</strong> prévu le 
            <strong>${new Date(event.eventDate).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric"
            })}</strong>
            au <strong>${event.eventLocation}</strong>.
            </p>

            <p style="font-size: 16px; color: #333;">
            Nous n’avons pas encore reçu votre réponse.  
            Pour nous aider à finaliser l’organisation, merci de confirmer votre présence en cliquant ci-dessous :
            </p>

            <div style="text-align: center; margin: 20px 0;">
            <a href="${rsvpLink}" 
                style="background-color: #D4AF37; color: white; padding: 12px 24px; 
                    border-radius: 6px; text-decoration: none; font-weight: bold;">
                📩 Répondre à l'invitation
            </a>
            </div>

            <p style="font-size: 14px; color: #666;">
            Si le bouton ne s’affiche pas correctement, vous pouvez utiliser ce lien :
            </p>
            <p style="font-size: 14px; color: #555; word-break: break-all;">
            <a href="${rsvpLink}" target="_blank">${rsvpLink}</a>
            </p>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

            <p style="font-size: 13px; color: #888; text-align: center;">
            Merci d’avance pour votre retour 🙏<br>
            Au plaisir de vous compter parmi nous,<br>
            ${event.eventTitle.split('de')[1] || ''}
            </p>

        </div>
    </div>
    `;

    const sendSmtpEmail = {
        sender: { name: "Smart Invite", email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email: guest.email, name: guest.full_name }],
        subject: `🔔 Rappel – Merci de confirmer votre présence au ${event.eventTitle}`,
        htmlContent
    }

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email(Rappel) envoyé à ${guest.email}`);
}

async function sendFileQRCodeMail(guest, qrCodeUrl) {
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

    // 1 Télécharger l’image du QR code sous forme de binaire
    const qrResponse = await axios.get(qrCodeUrl, {
        responseType: "arraybuffer",
    });

    // 2 La convertir en base64
    const qrBase64 = Buffer.from(qrResponse.data).toString("base64");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; font-size:14px;">
        <p>Bonjour <strong>${guest.full_name}</strong>,</p>

        <p>
          Votre <strong>QR-code d’accès</strong> pour le mariage est joint à ce mail.
          Il vous servira de laissez-passer le jour de l’événement.
        </p>

        <p>
          Merci encore pour votre présence ✨  
        </p>

        <p>Cordialement,<br><strong>Les futurs mariés</strong></p>
      </div>
    `;

    const sendSmtpEmail = {
      sender: { name: "Smart Invite", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: guest.email, name: guest.full_name }],
      subject: "📩 Invitation : votre QR-code d’accès",
      htmlContent,
      attachment: [
        {
          name: "qr-code-mariage.png",
          content: qrBase64
        }
      ]
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email(qr-code) envoyé à ${guest.email}`);
}

module.exports = {sendGuestEmail, sendInvitationToGuest, sendReminderMail, sendFileQRCodeMail};