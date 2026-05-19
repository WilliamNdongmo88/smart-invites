const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

let isReady = false;

const client = new Client({

    authStrategy: new LocalAuth({
        clientId: 'main'
    }),

    webVersionCache: {
        type: 'local'
    },

    puppeteer: {

        headless: process.env.HEADLESS === 'true',

        executablePath: process.env.NODE_ENV === 'production'
            ? '/usr/bin/chromium'
            : undefined,

        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions'
        ]
    }
});

client.on('qr', (qr) => {

    console.log('Scanner le QR Code :');

    qrcode.generate(qr, {
        small: true
    });
});

client.on('authenticated', () => {
    console.log('WhatsApp authentifié ✅');
});

client.on('ready', () => {

    console.log('WhatsApp connecté ✅');

    isReady = true;
});

client.on('loading_screen', (percent, message) => {

    console.log('Chargement :', percent, message);
});

client.on('disconnected', async (reason) => {

    console.log('❌ WhatsApp déconnecté :', reason);

    isReady = false;

    console.log('Tentative de reconnexion...');

    try {

        await client.initialize();

    } catch (error) {

        console.error('Erreur reconnexion :', error);
    }
});

client.on('auth_failure', (msg) => {

    console.log('Erreur authentification ❌');

    console.log(msg);

    isReady = false;
});

client.initialize();

const sendMessage = async (numero, message) => {

    if (!isReady) {
        throw new Error('WhatsApp non prêt');
    }

    const chatId = `${numero}@c.us`;

    try {

        await client.sendMessage(chatId, message);

        return true;

    } catch (error) {

        console.error(error);

        throw error;
    }
};

const sendGuestWhatsapp = async (
    guest,
    event,
    token
) => {

    if (!isReady) {
        throw new Error('WhatsApp non prêt');
    }

    try {

        /**
         * Vérification numéro invité !guest.phone || 
         */
        if (!guest.phone_number) {
            throw new Error(
                'Numéro WhatsApp invité introuvable'
            );
        }

        /**
         * Nettoyage numéro
         */
        const numero =
            guest.phone_number.replace(/\D/g, '');

        /**
         * Vérifier numéro WhatsApp
         */
        const numberId =
            await client.getNumberId(numero);

        if (!numberId) {
            throw new Error(
                'Numéro WhatsApp invalide'
            );
        }

        const chatId = numberId._serialized;

        /**
         * Lien RSVP
         */
        const rsvpLink =
            `${process.env.API_URL}/invitations/${token}`;

        /**
         * Variables événement
         */
        let article = '';
        let sentence = '';
        let concerned = '';
        let eventType = '';

        switch (event.type) {

            case 'wedding':

                concerned =
                    `${event.event_name_concerned1} et ${event.event_name_concerned2}`;

                article = 'au ';

                eventType =
                    `Mariage de ${concerned}`;

                sentence =
                    `Nous avons le plaisir de vous inviter à célébrer notre union`;

                break;

            case 'engagement':

                concerned =
                    `${event.event_name_concerned1} et ${event.event_name_concerned2}`;

                article = 'aux ';

                eventType =
                    `Fiançailles de ${concerned}`;

                sentence =
                    `Nous avons le plaisir de vous inviter à célébrer nos fiançailles`;

                break;

            case 'anniversary':

                concerned =
                    `${event.event_name_concerned1} et ${event.event_name_concerned2}`;

                article = "à l'";

                eventType =
                    `Anniversaire de mariage de ${concerned}`;

                sentence =
                    `Nous avons le plaisir de vous inviter à célébrer notre anniversaire de mariage`;

                break;

            case 'birthday':

                concerned =
                    event.event_name_concerned1;

                article = "à l'";

                eventType =
                    `Anniversaire de ${concerned}`;

                sentence =
                    `J'ai le plaisir de vous inviter à célébrer mon anniversaire`;

                break;

            default:

                concerned =
                    event.event_name_concerned1;

                article = "à l'";

                eventType = 'événement';

                sentence =
                    `Nous avons le plaisir de vous inviter`;

                break;
        }

        /**
         * Date formatée
         */
        const formattedDate =
            new Date(event.event_date)
                .toLocaleDateString(
                    'fr-FR',
                    {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    }
                );

        /**
         * Message WhatsApp
         */
        const whatsappMessage = `
            💌 *Vous êtes invité ${article}${eventType}*

            Bonjour *${guest.full_name}*,

            ${sentence} le *${formattedDate}* ✨

            📍 Votre présence compte énormément pour nous ❤️

            Merci de confirmer votre présence en cliquant sur le lien ci-dessous :

            ✅ *Confirmer ma présence (RSVP)*  
            ${rsvpLink}

            Si le lien ne fonctionne pas, copiez-le simplement dans votre navigateur.

            À très bientôt 💖

            *${concerned}*

            ━━━━━━━━━━━━━━━
            Smart Invite
        `;

        /**
         * Envoi WhatsApp
         */
        await client.sendMessage(
            chatId,
            whatsappMessage
        );

        console.log(
            `✅ Invitation WhatsApp envoyée à ${guest.full_name}`
        );

        return true;

    } catch (error) {

        console.error(
            '❌ Erreur WhatsApp invitation invité :',
            error
        );

        throw error;
    }
};

/**
 * Envoi PDF par WhatsApp
 */
const sendPdfByWhatsapp = async (data, pdfBuffer) => {

    if (!isReady) {
        throw new Error('WhatsApp non prêt');
    }

    const user = data;
    const event = data;

    if (!user.phone) {
        throw new Error('Numéro WhatsApp introuvable');
    }

    /**
     * Nettoyage du numéro
     */
    const numero = user.phone.replace(/\D/g, '');

    const numberId = await client.getNumberId(numero);

    if (!numberId) {
        throw new Error('Numéro WhatsApp invalide');
    }

    const chatId = numberId._serialized;

    /**
     * Message WhatsApp
     */
    const caption = `
        📩 *Liste récapitulative des invités*

        Bonjour ${user.name || ''},

        Veuillez trouver ci-joint le récapitulatif des invités pour l'événement :

        🎉 *${event.title}*

        Cordialement,
        Smart Invite
    `;

    try {

        /**
         * Conversion Buffer -> Base64
         */
        const base64Pdf = pdfBuffer.toString('base64');

        /**
         * Création média PDF
         */
        const media = new MessageMedia(
            'application/pdf',
            base64Pdf,
            'recapitulatif_invites.pdf'
        );

        /**
         * Envoi PDF
         */
        await client.sendMessage(
            chatId,
            media,
            {
                caption
            }
        );

        /**
         * Notification interne
         */
        await createNotification(
            event.eventId,
            `Votre liste d'invités récapitulative`,
            `Vous avez reçu par WhatsApp la liste de présence des invités.`,
            'info',
            false
        );

        console.log(`✅ PDF WhatsApp envoyé à ${numero}`);

        return true;

    } catch (error) {

        console.error('Erreur envoi WhatsApp PDF :', error);

        throw error;
    }
};

const sendFileQRCodeWhatsapp = async (data, qrCodeUrl) => {

    if (!isReady) {
        throw new Error('WhatsApp non prêt');
    }

    const guest = data;
    const event = data;

    if (!guest.phone_number) {
        throw new Error('Numéro WhatsApp introuvable');
    }

    /**
     * Nettoyage numéro
     */
    const numero = guest.phone_number.replace(/\D/g, '');

    try {

        /**
         * Vérifier si le numéro existe sur WhatsApp
         */
        const numberId = await client.getNumberId(numero);

        if (!numberId) {
            throw new Error('Numéro WhatsApp invalide');
        }

        const chatId = numberId._serialized;

        /**
         * Télécharger le QR Code
         */
        const qrResponse = await axios.get(qrCodeUrl, {
            responseType: 'arraybuffer'
        });

        /**
         * Conversion image --> base64
         */
        const qrBase64 = Buffer
            .from(qrResponse.data)
            .toString('base64');

        /**
         * Déterminer type événement
         */
        let article = '';
        let concerned = '';
        let eventType = '';

        switch (event.type) {

            case 'wedding':
                article = 'le ';
                eventType = 'mariage';
                concerned =
                    `${event.event_name_concerned1} et ${event.event_name_concerned2}`;
                break;

            case 'engagement':
                article = 'les ';
                eventType = 'fiançailles';
                concerned =
                    `${event.event_name_concerned1} et ${event.event_name_concerned2}`;
                break;

            case 'anniversary':
                article = "l'";
                eventType = 'anniversaire de mariage';
                concerned =
                    `${event.event_name_concerned1} et ${event.event_name_concerned2}`;
                break;

            case 'birthday':
                article = "l'";
                eventType = 'anniversaire';
                concerned = event.event_name_concerned1;
                break;

            default:
                article = "l'";
                eventType = 'événement';
                concerned = event.event_name_concerned1;
                break;
        }

        /**
         * Caption WhatsApp
         */
        const caption = `
            📩 *Votre QR-code d'accès*

            Bonjour *${guest.full_name}*,

            Votre QR-code d’accès pour ${article}${eventType} est joint à ce message.

            🎫 Ce QR-code servira de laissez-passer le jour de l’événement.

            ✨ Merci encore pour votre présence.

            Cordialement,
            *${concerned}*
        `;

        /**
         * Création image média
         */
        const media = new MessageMedia(
            'image/png',
            qrBase64,
            'qr-code.png'
        );

        /**
         * Envoi WhatsApp
         */
        await client.sendMessage(
            chatId,
            media,
            {
                caption
            }
        );

        console.log(`✅ QR Code WhatsApp envoyé à ${numero}`);

        return true;

    } catch (error) {

        console.error('Erreur WhatsApp QR Code :', error);

        throw error;
    }
};

function formatFullName(full_name) {
  if (!full_name) return '';
  
  return full_name.trim().replace(/\s+/g, '_');
}

const whatsappInvitationToGuest = async (
    data,
    qrCodeUrl,
    pdfBuffer
) => {

    if (!isReady) {
        throw new Error('WhatsApp non prêt');
    }

    const guest = data;
    const event = data;

    if (!guest.phone_number) {
        throw new Error('Numéro WhatsApp introuvable');
    }

    /**
     * Nettoyage numéro
     */
    const numero = guest.phone_number.replace(/\D/g, '');

    try {

        /**
         * Vérifier numéro WhatsApp
         */
        const numberId = await client.getNumberId(numero);

        if (!numberId) {
            throw new Error('Numéro WhatsApp invalide');
        }

        const chatId = numberId._serialized;

        /**
         * Télécharger QR Code
         */
        const qrResponse = await axios.get(qrCodeUrl, {
            responseType: 'arraybuffer'
        });

        const qrBase64 = Buffer
            .from(qrResponse.data)
            .toString('base64');

        /**
         * Gestion PDF
         */
        let pdfBase64 = null;

        if (pdfBuffer != null) {

            pdfBase64 = pdfBuffer.toString('base64');

        } else {

            const eventInvNote =
                await getEventInvitNote(event.eventId);

            const pdfUrl = await getPdfUrlFromFirebase(
                `event_${event.eventId}_default_carte_${eventInvNote.code}.pdf`
            );

            const pdfResponse = await axios.get(pdfUrl, {
                responseType: 'arraybuffer'
            });

            pdfBase64 = Buffer
                .from(pdfResponse.data)
                .toString('base64');
        }

        /**
         * Variables événement
         */
        let article = '';
        let sentence = '';
        let concerned = '';
        let eventType = '';
        let signature = '';

        switch (event.type) {

            case 'wedding':

                concerned =
                    `${event.event_name_concerned1} et ${event.event_name_concerned2}`;

                article = 'au ';

                eventType =
                    `Mariage de ${concerned}`;

                sentence =
                    `Nous sommes ravis que vous ayez accepté notre invitation.`;

                signature =
                    `Les futurs mariés ${event.event_name_concerned1} 💍 ${event.event_name_concerned2}`;

                break;

            case 'engagement':

                concerned =
                    `${event.event_name_concerned1} et ${event.event_name_concerned2}`;

                article = 'aux ';

                eventType =
                    `Fiançailles de ${concerned}`;

                sentence =
                    `Nous sommes ravis que vous ayez accepté notre invitation.`;

                signature =
                    `Les futurs mariés ${event.event_name_concerned1} 💍 ${event.event_name_concerned2}`;

                break;

            case 'anniversary':

                concerned =
                    `${event.event_name_concerned1} et ${event.event_name_concerned2}`;

                article = "à l'";

                eventType =
                    `Anniversaire de mariage de ${concerned}`;

                sentence =
                    `Nous sommes ravis que vous ayez accepté notre invitation.`;

                signature = concerned;

                break;

            case 'birthday':

                concerned =
                    event.event_name_concerned1;

                article = "à l'";

                eventType =
                    `Anniversaire de ${concerned}`;

                sentence =
                    `Je suis ravi que vous ayez accepté mon invitation.`;

                signature = concerned;

                break;

            default:

                concerned =
                    event.event_name_concerned1;

                article = "à l'";

                eventType = 'événement';

                sentence =
                    `Merci d'avoir accepté notre invitation.`;

                signature = concerned;

                break;
        }

        /**
         * Message WhatsApp
         */
        const caption = `
            🎉 *Merci d'avoir confirmé votre présence !*

            Bonjour *${guest.full_name}*,

            💖 ${sentence}

            Votre présence compte énormément pour nous ❤️

            📎 Vous trouverez ci-joint :

            ✅ votre invitation officielle  
            ✅ votre QR-code d’accès

            Merci de les présenter le jour de l’événement.

            📅 ${article}${eventType}

            À très bientôt ✨

            *${signature}*
        `;

        /**
         * Création média QR Code
         */
        const qrMedia = new MessageMedia(
            'image/png',
            qrBase64,
            `${formatFullName(guest.full_name)}-qr-code.png`
        );

        /**
         * Création média PDF
         */
        const pdfMedia = new MessageMedia(
            'application/pdf',
            pdfBase64,
            `${formatFullName(guest.full_name)}-invitation.pdf`
        );

        /**
         * Envoi QR Code
         */
        await client.sendMessage(
            chatId,
            qrMedia,
            {
                caption
            }
        );

        /**
         * Petit délai anti-spam
         */
        await new Promise(resolve =>
            setTimeout(resolve, 2000)
        );

        /**
         * Envoi PDF
         */
        await client.sendMessage(
            chatId,
            pdfMedia
        );

        console.log(
            `✅ Invitation WhatsApp envoyée à ${numero}`
        );

        return true;

    } catch (error) {

        console.error(
            'Erreur WhatsApp invitation :',
            error
        );

        throw error;
    }
};

const sendWhatsappToAdmin = async (
    name,
    email,
    phone,
    subject,
    message
) => {

    if (!isReady) {
        throw new Error('WhatsApp non prêt');
    }

    /**
     * Numéro admin depuis .env
     */
    const adminPhone =
        process.env.ADMIN_PHONE?.replace(/\D/g, '');

    if (!adminPhone) {
        throw new Error(
            'Numéro WhatsApp admin introuvable'
        );
    }

    try {

        /**
         * Vérifier numéro WhatsApp admin
         */
        const numberId =
            await client.getNumberId(adminPhone);

        if (!numberId) {
            throw new Error(
                'Numéro WhatsApp admin invalide'
            );
        }

        const chatId = numberId._serialized;

        /**
         * Sujet formaté
         */
        let subj = '';

        switch (subject) {

            case 'support':
                subj = 'Support technique';
                break;

            case 'sales':
                subj = 'Demande commerciale';
                break;

            case 'partnership':
                subj = 'Partenariat';
                break;

            case 'feedback':
                subj = "Retour d'expérience";
                break;

            case 'other':
                subj = 'Autre';
                break;

            default:
                subj = 'Nouveau message';
                break;
        }

        /**
         * Message WhatsApp
         */
        const whatsappMessage = `
            📩 *Nouveau message de contact*

            👤 *Nom :*${name}

            📧 *Email :*${email}

            📱 *Téléphone :*${phone || 'Non renseigné'}

            📝 *Sujet :*${subj}

            💬 *Message :*${message}

            ━━━━━━━━━━━━━━━
            Smart Invite
        `;

        /**
         * Envoi WhatsApp
         */
        await client.sendMessage(
            chatId,
            whatsappMessage
        );

        console.log(
            '✅ Message WhatsApp envoyé à Admin SmartInvite'
        );

        return true;

    } catch (error) {

        console.error(
            'Erreur WhatsApp Admin :',
            error
        );

        throw error;
    }
};

const whatsappPaymentProofToAdminAboutChangePlan = async (
    user,
    planName,
    fileBuffer
) => {

    if (!isReady) {
        throw new Error('WhatsApp non prêt');
    }

    try {

        /**
         * Numéro admin
         */
        const adminPhone =
            process.env.ADMIN_PHONE?.replace(/\D/g, '');

        if (!adminPhone) {
            throw new Error(
                'Numéro WhatsApp admin introuvable'
            );
        }

        /**
         * Vérifier numéro admin
         */
        const numberId =
            await client.getNumberId(adminPhone);

        if (!numberId) {
            throw new Error(
                'Numéro WhatsApp admin invalide'
            );
        }

        const chatId = numberId._serialized;

        /**
         * Lien admin
         */
        const adminLink =
            `${process.env.API_URL}/admin`;

        /**
         * Conversion preuve paiement -> base64
         */
        const fileBase64 =
            fileBuffer.toString('base64');

        /**
         * Création image/media
         */
        const media = new MessageMedia(
            'image/png',
            fileBase64,
            `${formatFullName(user.name)}-payment-proof.png`
        );

        /**
         * Message WhatsApp
         */
        const caption = `
            ✨ *Nouvelle demande de changement de plan*

            👤 *Utilisateur :*
            ${user.name}

            📧 *Email :*
            ${user.email}

            📦 *Plan actuel :*
            ${user.plan}

            🚀 *Nouveau plan demandé :*
            ${planName}

            📎 Une preuve de paiement est jointe à ce message.

            Merci de vérifier et valider la demande.

            🔗 Accès administration :
            ${adminLink}

            ━━━━━━━━━━━━━━━
            Smart Invite
        `;

        /**
         * Envoi WhatsApp
         */
        await client.sendMessage(
            chatId,
            media,
            {
                caption
            }
        );

        console.log(
            `✅ Preuve paiement WhatsApp envoyée à Admin`
        );

        return true;

    } catch (error) {

        console.error(
            '❌ Erreur WhatsApp changement plan :',
            error
        );

        throw error;
    }
};

const whatsappNotificationToUserAboutChangePlan = async (
    user,
    plan
) => {

    if (!isReady) {
        throw new Error('WhatsApp non prêt');
    }

    try {

        /**
         * Vérification numéro utilisateur
         */
        if (!user.phone) {
            throw new Error(
                'Numéro WhatsApp utilisateur introuvable'
            );
        }

        /**
         * Nettoyage numéro
         */
        const numero =
            user.phone.replace(/\D/g, '');

        /**
         * Vérifier numéro WhatsApp
         */
        const numberId =
            await client.getNumberId(numero);

        if (!numberId) {
            throw new Error(
                'Numéro WhatsApp invalide'
            );
        }

        const chatId = numberId._serialized;

        /**
         * Lien pricing
         */
        const pricingLink =
            `${process.env.API_URL}/pricing`;

        /**
         * Message WhatsApp
         */
        let whatsappMessage = '';

        /**
         * Activation plan Pro
         */
        if (plan === 'professionnel') {

            whatsappMessage = `
                ✨ *Votre plan Pro a été activé*

                Bonjour *${user.name}*,

                Nous vous informons que votre plan a été mis à jour avec succès ✅

                📦 *Nouveau plan :*
                ${user.plan || 'Professionnel'}

                🚀 Vous avez désormais accès aux fonctionnalités avancées de Smart Invite.

                Merci de faire confiance à *Smart Invite* ❤️

                ━━━━━━━━━━━━━━━
                Smart Invite
            `;
        }

        /**
         * Retour au plan gratuit
         */
        if (plan === 'gratuit') {

            whatsappMessage = `
                ❌ *Annulation du plan Pro*

                Bonjour *${user.name}*,

                Nous vous informons que votre abonnement Pro a été annulé.

                📦 *Nouveau plan :*
                ${user.plan || 'Gratuit'}

                ⚠️ Vous n’avez désormais plus accès aux fonctionnalités avancées du plan Pro.

                Si cette annulation est une erreur ou si vous souhaitez réactiver votre abonnement, vous pouvez le faire à tout moment depuis votre espace personnel.

                🔗 Voir les plans disponibles :
                ${pricingLink}

                Notre équipe support reste disponible si besoin ❤️

                ━━━━━━━━━━━━━━━
                Smart Invite
            `;
        }

        /**
         * Fallback
         */
        if (!whatsappMessage) {

            whatsappMessage = `
                📩 *Notification Smart Invite*

                Bonjour *${user.name}*,

                Votre plan a été modifié avec succès.

                📦 Nouveau plan :
                ${user.plan || plan}

                ━━━━━━━━━━━━━━━
                Smart Invite
            `;
        }

        /**
         * Envoi WhatsApp
         */
        await client.sendMessage(
            chatId,
            whatsappMessage
        );

        console.log(
            `✅ Notification WhatsApp envoyée à ${user.name}`
        );

        return true;

    } catch (error) {

        console.error(
            '❌ Erreur WhatsApp notification plan :',
            error
        );

        throw error;
    }
};

module.exports = {
    sendMessage,
    sendGuestWhatsapp,
    sendPdfByWhatsapp,
    sendFileQRCodeWhatsapp,
    whatsappInvitationToGuest,
    sendWhatsappToAdmin,
    whatsappPaymentProofToAdminAboutChangePlan,
    whatsappNotificationToUserAboutChangePlan
};