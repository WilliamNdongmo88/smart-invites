const Brevo = require('@getbrevo/brevo');
const axios = require('axios');
const { createNotification, getNotifications } = require('../models/notification');
const { getEventScheduleByEventId, updateEventSchedule } = require('../models/event_schedules');
const { getLogoUrlFromFirebase, getPdfUrlFromFirebase } = require('./qrCodeService');
const { getEventInvitNote } = require('../models/event_invitation_notes');
require('dotenv').config();

async function sendGuestEmail(guest, event, token) {
  //console.log('[sendGuestEmail] event: ', event);
  const logo = await getLogoUrlFromFirebase('logo.png');
  //console.log('[sendGuestEmail] logo: ', logo);
  if(logo){
    const brevo = new Brevo.TransactionalEmailsApi();
  brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();
  const rsvpLink = `${process.env.API_URL}/invitations/${token}`;

  const date = event.event_date.toISOString().split('T')[0];
  const time = event.event_date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
  const banquetTime = event.banquet_time?.split(':00')[0];
  const religiousTime = event.religious_time?.split(':00')[0];

  let article = '';
  let sentence ='';
  let concerned = '';
  let eventType = '';
  switch (event.type) {
    case 'wedding':
        concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
        article ='au '
        eventType = 'Mariage de ' + concerned
        sentence = 'Nous avons le plaisir de vous inviter à célébrer notre union '
      break;
    case 'engagement':
        concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
        article ='aux '
        eventType = 'Fiançailles de ' + concerned
        sentence = 'Nous avons le plaisir de vous inviter à célébrer nos fiançailles '
      break;
    case 'anniversary':
        concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
        article ='à l\''
        eventType = 'Anniversaire de mariage de ' + concerned
        sentence = 'Nous avons le plaisir de vous inviter à célébrer notre anniversaire de mariage '
      break;
    case 'birthday':
        concerned = event.event_name_concerned1
        article ='à l\''
        eventType = 'anniversaire de ' + concerned
        sentence = 'J\'ai le plaisir de vous inviter à célébrer mon anniversaire '
      break;
  }
  const sendSmtpEmail = {
    to: [{ email: guest.email, name: guest.full_name }],
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Smart Invite' },
    subject: `🎉 Invitation ${article}${event.event_title}`,
    htmlContent: `
      <!DOCTYPE html>
      <html lang="fr">
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <!-- BODY -->
                      <div style="
                        max-width: 650px;
                        background:#ffffff;
                        margin: 30px auto;
                        padding: 25px 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                      ">
                          <h2 style="text-align: center; color: #D4AF37;">💍 Vous êtes invité ${article}${eventType}</h2>
                          <p style="font-size: 14px; color: #333;">
                              Bonjour <strong>${guest.full_name}</strong>,
                          </p>
                          <p style="font-size: 13px; color: #333;">
                              ${sentence} le 
                              <strong>${new Date(event.event_date).toLocaleDateString("fr-FR", {
                              day: "numeric", month: "long", year: "numeric"
                              })}</strong>.
                          </p>
                          
                          <p style="font-size: 13px; color: #333;">
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
                              ${concerned}
                          </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  };

  await brevo.sendTransacEmail(sendSmtpEmail);
  console.log(`✅ Email(Invitation) envoyé à ${guest.email}`);
  }
};

async function sendInvitationToGuest(data, qrCodeUrl, pdfBuffer) {
  console.log('data:', data);
  // console.log('qrCodeUrl:', qrCodeUrl);
  // console.log('pdfBuffer:', pdfBuffer);
  const guest = data;
  const event = data;
  let pdfBase64 = null;
  
  // 1 Télécharger l’image du QR code sous forme de binaire
  const qrResponse = await axios.get(qrCodeUrl, {
      responseType: "arraybuffer",
  });
  // 2 La convertir en base64
  const qrBase64 = Buffer.from(qrResponse.data).toString("base64");

  if(pdfBuffer != null){
    pdfBase64 = pdfBuffer.toString("base64");
  }else{
    const eventInvNote = await getEventInvitNote(event.eventId);
    // console.log('[eventInvNote]: ', eventInvNote);
    const pdfUrl = await getPdfUrlFromFirebase(`event_${event.eventId}_default_carte_${eventInvNote.code}.pdf`);
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: "arraybuffer",
    });
    pdfBase64 = Buffer.from(pdfResponse.data).toString("base64");
    // console.log('pdfBase64: ', pdfBase64);
  }
  const logo = await getLogoUrlFromFirebase('logo.png');
  if(logo){
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

    let article = '';
    let sentence ='';
    let concerned = '';
    let eventType = '';
    let signature = '';
    switch (event.type) {
      case 'wedding':
          concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
          article ='au '
          eventType = 'Mariage de ' + concerned
          sentence = 'Nous sommes ravis que vous ayez accepté notre invitation.'
          signature = `Les futurs mariés ${event.event_name_concerned1} 💍 ${event.event_name_concerned2}`
        break;
      case 'engagement':
          concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
          article ='aux '
          eventType = 'Fiançailles de ' + concerned
          sentence = 'Nous sommes ravis que vous ayez accepté notre invitation.'
          signature = `Les futurs mariés ${event.event_name_concerned1} 💍 ${event.event_name_concerned2}`
        break;
      case 'anniversary':
          concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
          article ='à l\''
          eventType = 'Anniversaire de mariage de ' + concerned
          sentence = 'Nous sommes ravis que vous ayez accepté notre invitation.'
          signature = concerned
        break;
      case 'birthday':
          concerned = event.event_name_concerned1
          article ='à l\''
          eventType = 'anniversaire de ' + concerned
          sentence = 'Je suis ravis que vous ayez accepté mon invitation.'
          signature = concerned
        break;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <!-- BODY -->
                      <center>
                        <div style="
                          max-width: 650px;
                          background:#ffffff;
                          margin: 30px auto;
                          padding: 25px 30px;
                          border-radius: 8px;
                          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                        ">
                          <h2 style="color: #816405ff; margin-top:0;">
                            💖 Merci d'avoir confirmé votre présence ${article}${eventType} !
                          </h2>

                          <p>Bonjour <strong>${guest.full_name}</strong>,</p>

                          <p>
                            ${sentence}
                            Votre présence compte énormément pour nous ❤️.
                          </p>

                          <p>
                            Vous trouverez en pièce jointe votre invitation officielle et votre <strong>QR-code d’accès</strong>.
                          </p>
                          <p>Merci de les présenter le jour de l'événement.</p>

                          <p>
                            Si vous avez des questions, n’hésitez surtout pas à nous contacter.
                          </p>

                          <p style="margin-top:25px;">À très bientôt,</p>
                          <p><strong>${signature}</strong></p>
                        </div>
                      </center>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const sendSmtpEmail = {
      sender: { name: "Smart Invite", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: guest.email, name: guest.full_name }],
      subject: "🎉 Merci d'avoir confirmé votre présence !",
      htmlContent,
      attachment: [
        {
          name: `${formatFullName(guest.full_name)}-qr-code.png`,
          content: qrBase64,
        },
        {
          name: `${formatFullName(guest.full_name)}-invitation.pdf`,
          content: pdfBase64,
        }
      ],
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email(qr-code et pdf) envoyé à ${guest.email}`);
  }
}

function formatFullName(full_name) {
  if (!full_name) return '';
  
  return full_name.trim().replace(/\s+/g, '_');
}

async function sendReminderMail(guest, event) {
  const logo = await getLogoUrlFromFirebase('logo.png');
  if(logo){
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();
    const rsvpLink = `${process.env.API_URL}/invitations/${event.invitationToken}`;

    let article = '';
    let concerned = '';
    let eventType = '';
    let signature = '';
    switch (event.type) {
      case 'wedding':
          concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
          article ='au '
          eventType = 'Mariage de ' + concerned
          signature = `Les futurs mariés ${event.event_name_concerned1} 💍 ${event.event_name_concerned2}`
        break;
      case 'engagement':
          concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
          article ='aux '
          eventType = 'Fiançailles de ' + concerned
          signature = `Les futurs mariés ${event.event_name_concerned1} 💍 ${event.event_name_concerned2}`
        break;
      case 'anniversary':
          concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
          article ='à l\''
          eventType = 'Anniversaire de mariage de ' + concerned
          signature = concerned
        break;
      case 'birthday':
          concerned = event.event_name_concerned1
          article ='à l\''
          eventType = 'anniversaire de ' + concerned
          signature = concerned
        break;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <!-- BODY -->
                      <div style="
                        max-width: 650px;
                        background:#ffffff;
                        margin: 30px auto;
                        padding: 25px 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                      ">
                          <h2 style="text-align: center; color: #D4AF37;">🔔 Rappel de confirmation</h2>

                          <p style="font-size: 16px; color: #333;">
                          Bonjour <strong>${guest.full_name}</strong>,
                          </p>

                          <p style="font-size: 16px; color: #333;">
                          Nous espérons que vous allez bien.  
                          Vous aviez été invité(e) ${article}
                          <strong>${eventType}</strong> prévu le 
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
                          ${signature}
                          </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
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
}

async function sendFileQRCodeMail(data, qrCodeUrl) {
  const logo = await getLogoUrlFromFirebase('logo.png');
  if(!logo) throw new Error("Logo non trouvé.");
    const guest = data;
    const event = data;
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

    // 1 Télécharger l’image du QR code sous forme de binaire
    const qrResponse = await axios.get(qrCodeUrl, {
        responseType: "arraybuffer",
    });

    // 2 La convertir en base64
    const qrBase64 = Buffer.from(qrResponse.data).toString("base64");

    let article ='';
    let concerned = '';
    let eventType = '';
    switch (event.type) {
      case 'wedding':
          article = 'le '
          eventType = 'mariage'
          concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
        break;
      case 'engagement':
          article = 'les '
          eventType = 'fiançailles'
          concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
        break;
      case 'anniversary':
          article = "l'"
          eventType = 'anniversaire de mariage'
          concerned = event.event_name_concerned1+' et '+event.event_name_concerned2
        break;
      case 'birthday':
          article = "l'"
          eventType = 'anniversaire'
          concerned = event.event_name_concerned1
        break;
      default:
          article = "l'"
          eventType = 'événement'
          concerned = event.event_name_concerned1
        break;
    }

    const htmlContent =`
      <!DOCTYPE html>
      <html lang="fr">
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <!-- BODY -->
                      <div style="
                        max-width: 650px;
                        background:#ffffff;
                        margin: 30px auto;
                        padding: 25px 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                      ">
                        <p>Bonjour <strong>${guest.full_name}</strong>,</p>

                          <p>
                            Votre <strong>QR-code d’accès</strong> pour ${article}${eventType} est joint à ce mail.
                            Il vous servira de laissez-passer le jour de l’événement.
                          </p>

                          <p>
                            Merci encore pour votre présence ✨  
                          </p>

                        <p>Cordialement,<br/><strong>${concerned}</strong></p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
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

async function sendGuestResponseToOrganizer(organizer, guest, rsvpStatus) {
    console.log('[sendGuestResponseToOrganizer] guest:', guest);
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();
    const logo = await getLogoUrlFromFirebase('logo.png');
    if(!logo) throw new Error("Logo non trouvé.");
    let subject = '';
    let reponse = '';
    switch (rsvpStatus) {
      case 'confirmed':
          subject = "✅ Reponse Invité."
          reponse = "vient d’accepter"
        break;
    
      case 'declined':
          subject = "❌ Reponse Invité."
          reponse = "a décliné"
        break;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <!-- BODY -->
                      <div style="
                        max-width: 650px;
                        background:#ffffff;
                        margin: 30px auto;
                        padding: 25px 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                      ">
                        <p>Bonjour <strong>${organizer.name}</strong>,</p>

                          <p>
                            Nous vous informons que l'invité <strong>${guest.full_name}</strong> ${reponse} votre invitation.
                          </p>
                          <p>
                            Vous pouvez consulter les détails dans votre espace organisateur.  
                          </p>

                        <p>Smart Invite</p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const sendSmtpEmail = {
      sender: { name: "Smart Invite", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: organizer.email, name: organizer.name }],
      subject: subject,
      htmlContent
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email(rsvp invité) envoyé à ${guest.email}`);
}

async function sendGuestPresenceToOrganizer(organizer, guest) {
    //console.log("###guest: ", guest);
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();
    const logo = await getLogoUrlFromFirebase('logo.png');
    if(!logo) throw new Error("Logo non trouvé.");
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <!-- BODY -->
                      <div style="
                        max-width: 650px;
                        background:#ffffff;
                        margin: 30px auto;
                        padding: 25px 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                      ">
                        <p>
                          L'invité <strong>${guest.full_name}</strong> vient d'arriver.
                        </p>

                        <p>Smart Invite</p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const sendSmtpEmail = {
      sender: { name: "Smart Invite", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: organizer.email, name: organizer.name }],
      subject: `✅ Arrivé Invité ${guest.full_name}`,
      htmlContent
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email(arrivé invité) envoyé à ${guest.email}`);
}

async function sendPdfByEmail(data, pdfBuffer) {
    const user = data;
    const event = data;
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

    const logo = await getLogoUrlFromFirebase('logo.png');
    if(!logo) throw new Error("Logo non trouvé.");
    // 1. Convertir le Buffer du PDF en Base64
    const base64Pdf = pdfBuffer.toString('base64');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
          <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                      <img src="${logo}" alt="SmartInvite Logo" 
                      style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                      <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                    </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                        <!-- BODY -->
                        <div style="
                          max-width: 650px;
                          background:#ffffff;
                          margin: 30px auto;
                          padding: 25px 30px;
                          border-radius: 8px;
                          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                        ">
                          <p>Bonjour,</p>
                            <p>Veuillez trouver ci-joint le récapitulatif des invités pour l'événement <strong>${event.title}</strong>.</p>
                            
                            <p>Cordialement,</p>
                          <p>Smart Invite</p>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                        © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                        <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                          ${process.env.API_URL}
                        </a>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
    `;

    const sendSmtpEmail = {
      sender: { name: "Smart Invite", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: user.email, name: user.name }],
      subject: "📩 Votre liste d'invités récapitulative",
      htmlContent,
      attachment: [
        {
          name: "recapitulatif_invites.pdf",
          content: base64Pdf
        }
      ]
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    await createNotification(
      event.eventId,
      `Votre liste d'invités récapitulative`,
      `Vous avez reçu par mail la liste de présence de tous les invités présents a votre événement.\n
       Veuillez consulter votre boîte mail.`,
      'info',
      false
    );
    console.log(`✅ Email(pdf) envoyé à ${user.email}`);
}

async function sendPdfToGuestMail(data) {
  const guest = data.guest;
  const pdfBuffer = data.buffer;
    try {
      const brevo = new Brevo.TransactionalEmailsApi();
      brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();
      if (!guest?.email) {
          throw new Error("Email de l'invité manquant");
      }

      const pdfBase64 = pdfBuffer.toString("base64");

      const message = `
        <!DOCTYPE html>
        <html lang="fr">
          <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                      <img src="${logo}" alt="SmartInvite Logo" 
                      style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                      <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                    </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                        <!-- BODY -->
                        </center>
                          <p>Bonjour <strong>${guest.full_name}</strong>,</p>

                          <p>Vous trouverez en pièce jointe votre invitation officielle.</p>

                          <br>
                          <p>✨ À très bientôt</p>
                        </center>  
                        <p><strong>L'équipe Smart Invite</strong></p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                        © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                        <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                          ${process.env.API_URL}
                        </a>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      const sendSmtpEmail = {
        to: [{ email: guest.email, name: guest.full_name }],
        sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Smart Invite' },
        subject: "📩 Votre invitation officielle",
        htmlContent: message,
        attachment: [
            {
                content: pdfBase64,
                name: `${formatFullName(guest.full_name)}-invitation.pdf`,
            },
        ],
      };

      await brevo.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Invitation PDF envoyée à ${guest.email}`);
    } catch (error) {
        console.error("[sendPdfToGuestMail] BREVO ERROR:", error.message);
        throw error;
    }
};

async function sendThankYouMailToPresentGuests(event, schedules, organizer, guest) {
  //console.log('guest:', guest);
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

    const logo = await getLogoUrlFromFirebase('logo.png');
    if(!logo) throw new Error("Logo non trouvé.");

  let sentences = '';
  let sentences_2 = '';
  let sentences_3 = '';
  let concerned = '';
  let eventType = '';
  switch (event.type) {
    case 'wedding':
        eventType = 'mariage'
        sentences = `Nous tenons à vous remercier chaleureusement pour votre présence à notre ${eventType}`
        sentences_2 = "Nous espérons vous revoir très bientôt lors de nos prochaines rencontres."
        sentences_3 = "Avec nos sincères remerciements,"
        concerned = `Le couple ${event.event_name_concerned1} et ${event.event_name_concerned2}`
      break;
    case 'engagement':
        eventType = 'fiançailles'
        sentences = `Nous tenons à vous remercier chaleureusement pour votre présence à nos ${eventType}`
        sentences_2 = "Nous espérons vous revoir très bientôt lors de nos prochaines rencontres."
        sentences_3 = "Avec nos sincères remerciements,"
        concerned = `Les futurs mariés ${event.event_name_concerned1} et ${event.event_name_concerned2}`
      break;
    case 'anniversary':
        eventType = 'anniversaire de mariage'
        sentences = `Nous tenons à vous remercier chaleureusement pour votre présence à notre ${eventType}`
        sentences_2 = "Nous espérons vous revoir très bientôt lors de nos prochaines rencontres."
        sentences_3 = "Avec nos sincères remerciements,"
        concerned = `Le couple ${event.event_name_concerned1} et ${event.event_name_concerned2}`
      break;
    case 'birthday':
        eventType = 'anniversaire'
        sentences = `Je tiens à vous remercier chaleureusement pour votre présence à mon ${eventType}`
        sentences_2 = "J'espére vous revoir très bientôt lors de nos prochaines rencontres."
        sentences_3 = "Avec mes sincères remerciements,"
        concerned = event.event_name_concerned1
      break;
  }
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                  <img src="${logo}" alt="SmartInvite Logo" 
                  style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                  <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                    <!-- BODY -->
                    <div style="
                      max-width: 650px;
                      background:#ffffff;
                      margin: 30px auto;
                      padding: 25px 30px;
                      border-radius: 8px;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    ">
                      <p>Bonjour <strong>${guest.full_name}</strong>,</p>

                        <p>
                          ${sentences}
                        </p>
                        <p>
                          Votre participation a contribué à rendre cette événement mémorable.
                        </p>

                        <p>
                          ${sentences_2}
                        </p>

                        <p style="margin-top:20px;">${sentences_3}</p>

                      <p style="font-weight:bold;">${concerned}</p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                    © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                    <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                      ${process.env.API_URL}
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

    const sendSmtpEmail = {
      sender: { name: "Smart Invite", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: guest.email, name: guest.full_name }],
      subject: `✅[${guest.full_name}] – Merci d’être venu !`,
      htmlContent
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    await notifications(schedules, organizer);
    console.log(`✅ Email(Remerciement) envoyé à ${guest.email}`);
    return true;
}

async function notifications(schedules, organizer) {
  try {
    const schedule_bd = await getEventScheduleByEventId(schedules.event_id);
    console.log('schedule_bd: ', schedule_bd);
    if (!schedule_bd.is_checkin_executed) {
      console.log('is_checkin_executed: ', schedule_bd.is_checkin_executed);
      const scheduleId = schedule_bd.id;
      const updatedSchedule = await updateEventSchedule(scheduleId, schedule_bd.event_id, schedules.scheduled_for, true, true);
      console.log('updatedSchedule : ', updatedSchedule);
      await createNotification(
        schedules.event_id,
        `Rapport d'envoi du message automatique`,
        `Le message de remerciement automatique a bien été envoyé a tous les invités présents.`,
        'info',
        false
      );
      await notifyOrganizerAboutSendThankYouMailToPresentGuests(organizer);
    }else{
      console.log('.### Notification déjà envoyé...');
    }
  } catch (error) {
    throw new Error("notifications error : " + error.message);
  }
}

async function notifyOrganizerAboutSendThankYouMailToPresentGuests(organizer) {
    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

    const logo = await getLogoUrlFromFirebase('logo.png');
    if(!logo) throw new Error("Logo non trouvé.");
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <!-- BODY -->
                      <div style="
                        max-width: 650px;
                        background:#ffffff;
                        margin: 30px auto;
                        padding: 25px 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                      ">
                        <p>
                          Bonjour <strong>${organizer.name}</strong>
                        </p>
                        <p>
                          Le message de remerciement automatique a bien été envoyé a tous les invités présents.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const sendSmtpEmail = {
      sender: { name: "Smart Invite", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: organizer.email, name: organizer.name }],
      subject: `✅ Rapport d'envoi du message automatique`,
      htmlContent
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email(Report of thank-email) envoyé à ${organizer.email}`);
}

async function manualSendThankYouMailToPresentGuests(eventId, thankMessage, guest) {

  const brevo = new Brevo.TransactionalEmailsApi();
  brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

  const logo = await getLogoUrlFromFirebase('logo.png');
  if (!logo) throw new Error("Logo non trouvé.");

  const formattedMessage = thankMessage.replace(/\n/g, '<br>');
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                  <img src="${logo}" alt="SmartInvite Logo" 
                  style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                  <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                        <!-- BODY -->
                  <div style="
                    max-width: 650px;
                    background:#ffffff;
                    margin: 30px auto;
                    padding: 25px 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                  ">

                    <!-- Message personnalisé -->
                    <div style="
                      margin: 20px 0;
                      padding: 15px;
                      background: #f9f7ef;
                      border-left: 4px solid #D4AF37;
                      font-style: italic;
                    ">
                      <p>${formattedMessage}</p>
                    </div>
                  </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                    © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                    <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                      ${process.env.API_URL}
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const sendSmtpEmail = {
    sender: { name: "Smart Invite", email: process.env.BREVO_SENDER_EMAIL },
    to: [{ email: guest.email, name: guest.full_name }],
    subject: `✅ Merci pour votre présence`,
    htmlContent
  };

  await brevo.sendTransacEmail(sendSmtpEmail);

  console.log(`✅ Email de remerciement envoyé à ${guest.email}`);
  return true;
}

async function sendMailToAdmin(name, email, phone, subject, message) {
  const brevo = new Brevo.TransactionalEmailsApi();
  brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

  const formattedMessage = message.replace(/\n/g, '<br>');
  let subj = '';
  switch (subject) {
    case 'support':
      subj = "Support technique"
      break;
    case 'sales':
      subj = "Demande commerciale"
      break;
    case 'partnership':
      subj = "Partenariat"
      break;
    case 'feedback':
      subj = "Retour d'expérience"
      break;
    case 'other':
      subj = "Autre"
      break;
  }
  const sendSmtpEmail = {
    to: [{ email: process.env.ADMIN_EMAIL, name: process.env.ADMIN_NAME }],
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Smart Invite' },
    subject: subj || 'Nouveau message de contact',
    htmlContent: ` 
      <!DOCTYPE html>
      <html lang="fr">
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <!-- BODY -->
                      <h3>Nouveau message de contact</h3>
                      <p><strong>Nom :</strong> ${name}</p>
                      <p><strong>Email :</strong> ${email}</p>
                      <p><strong>Téléphone :</strong> ${phone || 'Non renseigné'}</p>
                      <p><strong>Message :</strong></p>
                      <p>${formattedMessage}</p>          
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  };

  await brevo.sendTransacEmail(sendSmtpEmail);
  console.log(`✅ Email(Contact Us) envoyé à Admin SmartInvite`);
};

async function sendNewsLetterToUsers() {
  console.log("Envoie de la news letter")
  const brevo = new Brevo.TransactionalEmailsApi();
  brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

  const rsvpLink = `${process.env.API_URL}`;
  const msg = `
    Bonjour,

    Nous sommes ravis de vous partager les dernières nouveautés de SmartInvite, 
    la plateforme pensée pour simplifier l’organisation et la gestion de vos événements de mariage.

    🚀 Quoi de neuf ?

    ✅ Gestion améliorée des invités et confirmations (RSVP)

    📱 Check-in rapide via QR Code

    📊 Suivi en temps réel de la présence

    💌 Messages de remerciement automatisés après l’événement

    Notre objectif est de vous offrir une expérience toujours plus fluide et intuitive.

    👉 Découvrez toutes les fonctionnalités dès maintenant

    ${rsvpLink}

    💡 Pourquoi recevoir cette newsletter ?

    Vous recevez cet email car vous avez créé un compte ou activé la news letter.
    Nous partageons uniquement des informations utiles liées à la plateforme.

    🔕 Se désabonner

    Si vous ne souhaitez plus recevoir nos communications, vous pouvez vous désabonner à tout moment :

    👉 Se désabonner de la newsletter
    {{unsubscribe}}
  `;
  const formattedMessage = msg.replace(/\n/g, '<br>');

  const sendSmtpEmail = {
    to: [{ email: 'williamndongmo88@gmail.com', name: process.env.ADMIN_NAME }],
    sender: { email: process.env.ADMIN_EMAIL, name: 'Smart Invite' },
    subject: "✨ Nouveautés SmartInvite – Simplifiez vos événements",
    htmlContent: ` 
      <p>${formattedMessage}</p>
    `
  };

  await brevo.sendTransacEmail(sendSmtpEmail);
  console.log(`✅ Email(New letter) envoyé à aux users`);
};

async function sendNewsUpdatesToUsers(user) {
  try {
    console.log("📨 Envoi de la newsletter à:", user.email);

    const logo = await getLogoUrlFromFirebase('logo.png');

    if (!logo) {
      console.error("❌ Logo introuvable");
      return;
    }

    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey =
      process.env.BREVO_API_KEY?.trim();

    const rsvpLink = `${process.env.API_URL}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Nouveautés SmartInvite</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <p>Bonjour,</p>

                      <p>
                        Nous sommes ravis de vous présenter les toutes dernières nouveautés de 
                        <strong>SmartInvite</strong>, la plateforme pensée pour simplifier l’organisation 
                        et la gestion de vos événements de mariage.
                      </p>

                      <h3 style="margin-top:30px; color:#0f172a;">🚀 Quoi de neuf ?</h3>

                      <p>
                        <strong>✅ Création d’événements améliorée</strong><br />
                        Une gestion plus fluide, plus rapide et plus intuitive.
                      </p>

                      <p>
                        <strong>🎨 Import de votre carte d’invitation (PDF)</strong><br />
                        Importez votre propre modèle de carte d’invitation au format PDF et associez-le directement à votre événement.
                      </p>

                      <p>
                        <strong>📱 Check-in rapide via QR Code</strong><br />
                        Une amélioration majeure du scan de QR Code pour un accès plus rapide et sécurisé lors de vos événements.
                      </p>

                      <p>
                        <strong>📊 Suivi de présence en temps réel</strong><br />
                        Visualisez instantanément les invités présents et gérez vos statistiques en toute simplicité.
                      </p>

                      <p>
                        <strong>💌 Messages de remerciement automatisés</strong><br />
                        Envoyez automatiquement des messages de remerciement à vos invités après l’événement.
                      </p>

                      <p>
                        Notre objectif est de vous offrir une expérience toujours plus fluide, moderne et intuitive.
                      </p>

                      <!-- CTA -->
                      <div style="text-align:center; margin:40px 0;">
                        <a href="${rsvpLink}" 
                          style="
                            background-color:#D4AF37;
                            color:#ffffff;
                            text-decoration:none;
                            padding:14px 26px;
                            border-radius:6px;
                            font-weight:bold;
                            display:inline-block;
                          ">
                          👉 Découvrir les nouveautés
                        </a>
                      </div>

                      <p style="margin-top:40px;">
                        À très bientôt, <strong>L’équipe SmartInvite </strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const sendSmtpEmail = {
      to: [{ email: user.email, name: user.name || "Utilisateur" }],
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "Smart Invite",
      },
      subject: "✨ Nouveautés SmartInvite – Simplifiez vos événements",
      htmlContent: htmlContent,
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email envoyé avec succès:", user.name);

  } catch (error) {
    console.error("❌ Erreur envoi newsletter Brevo:", error.response?.body || error.message);
  }
}

async function sendPaymentProofToAdminAboutChangePlan(user, fileBuffer) {
  try {
    const logo = await getLogoUrlFromFirebase('logo.png');

    if (!logo) {
      console.error("❌ Logo introuvable");
      return;
    }

    const adminLink = `${process.env.API_URL}/admin`;

    // Convertir en base64
    const fileBase64 = fileBuffer.toString("base64");

    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Nouveautés SmartInvite</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <h2 style="color:#1a3c8b;">Demande de changement de plan</h2>

                      <p><strong>Utilisateur :</strong> ${user.name}</p>
                      <p><strong>Email :</strong> ${user.email}</p>
                      <p><strong>Plan :</strong> ${user.plan}</p>

                      <p>
                        Une preuve de paiement est jointe à cet email.
                        Merci de vérifier et valider la demande.
                      </p>

                      <div style="margin-top:30px;">
                        <a href="${adminLink}" 
                          style="
                            background-color:#1a3c8b;
                            color:#ffffff;
                            padding:12px 20px;
                            text-decoration:none;
                            border-radius:5px;
                            display:inline-block;
                            font-weight:bold;
                          ">
                          Vérifier et modifier le plan
                        </a>
                      </div>

                      <hr style="margin-top:30px;">
                      <p style="font-size:12px;color:#777;">
                        Email automatique - SmartInvite
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const sendSmtpEmail = {
      to: [{ email: process.env.BREVO_SENDER_EMAIL, name: process.env.ADMIN_NAME || "Utilisateur" }],
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "Smart Invite",
      },
      subject: "✨ Preuve de paiement - Changement de plan",
      htmlContent: htmlContent,
      attachment: [
        {
          name: `${formatFullName(user.name)}-payment_proof.png`,
          content: fileBase64,
        }
      ],
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email envoyé avec succès:", user.name);

  } catch (error) {
    console.error("❌ Erreur envoi newsletter Brevo:", error.response?.body || error.message);
  }
}

async function sendNotificationToUserAboutChangePlan(user) {
  try {
    const logo = await getLogoUrlFromFirebase('logo.png');

    if (!logo) {
      console.error("❌ Logo introuvable");
      return;
    }

    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY?.trim();

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Nouveautés SmartInvite</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f5f6f8; font-family: Arial, Helvetica, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; padding:20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D4AF37; padding:20px; text-align:center;">
                    <img src="${logo}" alt="SmartInvite Logo" 
                    style="width:100px; height:80px; margin:auto; display:block; border-radius:10px"/>
                    <p style="margin:5px 0 0; color:#ffffff;">Simplifiez l’organisation de vos événements</p>
                  </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:30px; color:#1f2937; font-size:15px; line-height:1.6;">
                      <h2 style="color:#1a3c8b;">Changement de plan confirmé</h2>

                      <p>Bonjour <strong>${user.name}</strong>,</p>

                      <p>
                        Nous vous informons que votre plan a été mis à jour avec succès.
                      </p>

                      <p>
                        <strong>Nouveau plan :</strong> ${user.plan || "Non spécifié"}
                      </p>

                      <p>
                        Si vous n'êtes pas à l'origine de cette modification,
                        veuillez contacter notre support immédiatement.
                      </p>

                      <p style="margin-top:30px;">
                        Merci de faire confiance à <strong>SmartInvite</strong>.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#D4AF37; padding:15px; text-align:center; font-size:12px; color:#ffffff;">
                      © ${new Date().getFullYear()} SmartInvite. Tous droits réservés.
                      <a href="${process.env.API_URL}" style="color:#ffffff; text-decoration:none;">
                        ${process.env.API_URL}
                      </a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const sendSmtpEmail = {
      to: [{ email: user.email, name: user.name || "Utilisateur" }],// 'williamndongmo899@gmail.com'
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "Smart Invite",
      },
      subject: "✨ Votre plan Pro a été activé",
      htmlContent: htmlContent,
    };

    await brevo.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email envoyé avec succès:", user.name);

  } catch (error) {
    console.error("❌ Erreur envoi newsletter Brevo:", error.response?.body || error.message);
  }
}

module.exports = {sendGuestEmail, sendInvitationToGuest, sendReminderMail, sendPdfByEmail,
  sendFileQRCodeMail, sendGuestResponseToOrganizer, sendGuestPresenceToOrganizer,
  sendThankYouMailToPresentGuests, notifyOrganizerAboutSendThankYouMailToPresentGuests,
  notifications, manualSendThankYouMailToPresentGuests, sendMailToAdmin, sendNewsLetterToUsers,
  sendPdfToGuestMail, sendNewsUpdatesToUsers, 
  sendNotificationToUserAboutChangePlan, sendPaymentProofToAdminAboutChangePlan
};