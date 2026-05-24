const { processGuestInvitationResponse } = require("./guest-response.service");
const { getGuestById } = require("../models/guests");
const { getInvitationByChatId, updateInvitationByChatId } = require("../models/invitations");

const handleRsvp = async (client, message) => {

    try {
        /**
         * Ignorer messages du bot
         */
        if (message.fromMe) {
            return;
        }

        /**
         * Texte utilisateur
         */
        const text = message.body.trim().toLowerCase();

        /**
         * Numéro WhatsApp
         */
        const phone = message.from;
        const chatId = message.from;

        console.log('ChatId:', chatId);
        console.log( `📩 Message reçu : ${text}` );

        /**
         * Retrouver invitation
         */
        const invitation = await getInvitationByChatId(chatId);
        if (!invitation) {
            await message.reply(
                `❌ Aucune invitation trouvée.`
            );
            return;
        }
        console.log('Invitation trouvée :', invitation);

        /**
         * Détection RSVP
         */
        let response = null;

        /**
         * Regex
         */
        const yesRegex =
            /\b(oui|ok|présent|present)\b/i;

        const noRegex =
            /\b(non|absent|désolé|desole)\b/i;

        const maybeRegex =
            /\b(peut-être|peut etre|possible)\b/i;

        /**
         * RSVP OUI
         */
        if (yesRegex.test(text)) {
            response = 'confirmed';
        }

        /**
         * RSVP NON
         */
        else if (
            noRegex.test(text)
        ) {
            response = 'declined';
        }

        /**
         * RSVP MAYBE
         */
        else if (
            maybeRegex.test(text)
        ) {
            response = 'maybe';
        }

        /**
         * Réponse inconnue
         */
        if (!response) {
            await message.reply(
                `😊 Merci pour votre message.\n\nVeuillez répondre uniquement avec :\n\n✅ OUI\n❌ NON\n❓ PEUT-ÊTRE`
            );
            return;
        }

        console.log( `✅ RSVP : ${response}` );

        /**
         * Réponse automatique
         */
        switch (response) {

            case 'confirmed':

                await message.reply(
                    `🎉 Merci pour votre confirmation❤️
                    \n Veuillez consulter les informations ci-dessous
                    \n 👇👇👇👇👇👇👇👇👇👇`
                );
                if(!invitation.is_invitation_sent){
                    const guest = await getGuestById(invitation.guest_id);
                    await processGuestInvitationResponse(guest, invitation, 'confirmed');
                    await updateInvitationByChatId(invitation.id, chatId, true);
                }else{
                    await message.reply(`✅ Votre invitation a déjà été envoyée.`);
                }
                break;

            case 'declined':

                await message.reply(
                    `🙏 Merci pour votre réponse.\n\nNous espérons vous voir une prochaine fois ❤️`
                );

                break;

            case 'maybe':

                await message.reply(
                    `😊 Merci !\n\nNous restons en attente de votre confirmation finale ❤️`
                );

                break;
        }

    } catch (error) {
        console.error( '❌ Erreur RSVP :', error );
    }
};

module.exports = { handleRsvp }