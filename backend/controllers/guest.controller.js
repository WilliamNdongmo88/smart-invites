const { getEventById, getGuestEmailRelatedToEvent} = require('../models/events');
const { deleteGuestFiles } = require('../services/invitation.service');
const { getGuestInvitationById } = require('../models/invitations');
const { sendInvitationToGuest, sendReminderMail, sendFileQRCodeMail } = require('../services/notification.service');
const { generateGuestQr } = require("../services/qrCodeService");
const { generateGuestPdf, uploadPdfToFirebase } = require("../services/pdfService");
const {
        createGuest, getGuestById, getAllGuestAndInvitationRelatedByEventId,
        update_guest, updateRsvpStatusGuest, delete_guest, getGuestByEmail,
        getAllGuestAndInvitationRelated,getGuestAndInvitationRelatedById,
        getEventByGuestId
    } = require('../models/guests');

const addGuest = async (req, res, next) => {
    try {
        if (!Array.isArray(req.body) || req.body.length === 0) {
            return res.status(400).json({ error: "La liste ne doit pas être vide" });
        }
        let guestDatas = req.body;
        //console.log('guestDatas :: ', guestDatas);
        let returnDatas = [];
        for (const guest of guestDatas) {
            const { eventId, fullName, email, phoneNumber, rsvpStatus, 
                guesthasPlusOneAutoriseByAdmin} = guest;
            const event = await getEventById(eventId);
            if(!event) return res.status(401).json({error: `Evénement avec l'id ${event.id} non trouvé!`});
            const result = await getGuestEmailRelatedToEvent(email, event.id);
            if(result) return res.status(409).json({error: `L'invité ${email} existe déjà`});
            const guestId = await createGuest(eventId, fullName, email, phoneNumber, 
                                              rsvpStatus, guesthasPlusOneAutoriseByAdmin);
            returnDatas.push({id: guestId, eventId, fullName, email, phoneNumber, 
                              rsvpStatus, guesthasPlusOneAutoriseByAdmin});
        }
        return res.status(201).json(returnDatas);
    } catch (error) {
        console.error('CREATE GUEST ERROR:', error.message);
        next(error);
    }
};

const getAllGuest = async (req, res, next) => {
    try {
        const guests = await getAllGuestAndInvitationRelated();
        if(!guests[0]) return res.status(401).json({error: "Aucun invité trouvé!"});
        return res.status(200).json({guests}); 
    } catch (error) {
        console.error('GET GUEST ERROR:', error.message);
        next(error);
    }
};

const getGuest = async (req, res, next) => {
    try {
        const guest = await getGuestAndInvitationRelatedById(req.params.guestId);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        return res.status(200).json(guest); 
    } catch (error) {
        console.error('GET GUEST ERROR:', error.message);
        next(error);
    }
};

const getEventByGuest = async (req, res, next) => {
    try {
        const result = await getEventByGuestId(req.params.guestId);
        if(!result) return res.status(404).json({error: "Invité non trouvé!"});
        return res.status(200).json(result[0]);
    } catch (error) {
        next(error);
    }
}

const getGuestsByEvent = async (req, res) => {
    try {
        const guests = await getAllGuestAndInvitationRelatedByEventId(req.params.eventId);
        if(guests.length == 0) return res.status(401).json({error: "Aucun invité n'est lié a cette événement! "});
        return res.status(200).json({guests});
    } catch (error) {
        console.error('GET EVENT GUEST ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const updateGuest = async (req, res, next) => {
    try {
        let updatedGuest = {};
        let isValid = false;
        let {
            eventId, fullName, email, phoneNumber, rsvpStatus,hasPlusOne, guesthasPlusOneAutoriseByAdmin, plusOneName, 
            notes, dietaryRestrictions, plusOneNameDietRestr, rsvpToken
        } = req.body;
        console.log('req.body:', req.body);
        let updateDate = null;
        const guest = await getGuestById(req.params.guestId);
        console.log('guestInBd:', guest);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        if(eventId==null) eventId = guest.event_id;
        if(fullName==null) fullName = guest.full_name;
        if(email==null) email = guest.email;
        if(phoneNumber==null) phoneNumber = guest.phone_number;
        if(rsvpStatus==null){
            rsvpStatus = guest.rsvp_status;
        }else if(rsvpStatus!=null && rsvpStatus=='confirmed' && hasPlusOne==false){
            // Si le RSVP est confirmé et qu'il n'y a personne qui l'accompagne
            // Envoyer l'invitation Qr-Code déjà généré par mail
            updateDate = new Date();
            const invitation = await getGuestInvitationById(req.params.guestId);
            //console.log('invitation:', invitation[0]);
            if(!invitation[0]) return res.status(404).json({error: "Invitation lié a cet invité introuvale!"});
            if(rsvpToken!= invitation[0].token) return res.status(404).json({error: "Token d'invitation invalide!"});
            try {
                await sendInvitationToGuest(guest, invitation[0].qr_code_url);
                isValid = true;
            } catch (error) {
                console.error('sendInvitationToGuest ERROR:', error.message);
                next(error);
            }
        }else if(rsvpStatus=='declined'){
            //console.log('RSVP décliné, pas d\'envoi d\'invitation');
            // Si le RSVP est décliné, ne pas envoyer l'invitation
            const invitation = await getGuestInvitationById(req.params.guestId);
            if(!invitation[0]) return res.status(404).json({error: "Invitation lié a cet invité introuvale!"});
            if(rsvpToken!= invitation[0].token) return res.status(404).json({error: "Token d'invitation invalide!"});
            updateDate = new Date();
            isValid = true;
        }
        if(guesthasPlusOneAutoriseByAdmin==null) {guesthasPlusOneAutoriseByAdmin = guest.guest_has_plus_one_autorise_by_admin;}
        if(hasPlusOne==null || hasPlusOne==undefined) hasPlusOne = guest.has_plus_one;
        if(plusOneName==null) plusOneName = guest.plus_one_name;
        if(updateDate==null) updateDate = guest.updated_at;
        if(notes==null) notes = guest.notes;
        if(dietaryRestrictions==null) dietaryRestrictions = guest.dietary_restrictions;
        if(plusOneNameDietRestr==null) plusOneNameDietRestr = guest.plus_one_name_diet_restr;
        //console.log('updatedGuest:', updatedGuest);
        if (rsvpStatus=='confirmed' && hasPlusOne==true && guest.has_plus_one==false) {
            // Si le champ hasPlusOne est passé à true
            // Supprimer l'ancienne invitation et les fichiers associés(QR code et PDF)
            // Envoyer une nouvelle invitation en tenant compte de la personne qui l'accompagne
            try {
                const guest = await getGuestAndInvitationRelatedById(req.params.guestId);
                if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
                if(rsvpToken!= guest.invitationToken) return res.status(404).json({error: "Token d'invitation invalide!"});
                await deleteGuestFiles(guest.guest_id, guest.invitationToken);
                await generateGuestQr(guest.guest_id, guest.invitationToken, "wedding-ring.jpg");
                const buffer = await generateGuestPdf(guest);
                await uploadPdfToFirebase(guest, buffer);
                await sendInvitationToGuest(guest, guest.qrCodeUrl);
                isValid = true;
            } catch (error) {
                console.error('sendInvitationToGuest ERROR:', error.message);
                next(error);
            }
        }
        if(isValid){
            await update_guest(req.params.guestId, eventId, fullName, email, phoneNumber, rsvpStatus, hasPlusOne,
            guesthasPlusOneAutoriseByAdmin, plusOneName, notes, dietaryRestrictions, plusOneNameDietRestr, updateDate);
            updatedGuest = await getGuestById(req.params.guestId);
        }else{
            const guest = await getGuestAndInvitationRelatedById(req.params.guestId);
            if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
            if(rsvpToken!= guest.invitationToken) return res.status(404).json({error: "Token d'invitation invalide!"});
            console.log('Aucune mise à jour effectuée car les conditions ne sont pas remplies.');
        }
        return res.status(200).json({updatedGuest});
    } catch (error) {
        console.error('UPDATE GUEST ERROR:', error.message);
        next(error);
    }
}

const updateRsvpStatus = async (req, res, next) => {
    try {
        const {rsvpStatus} = req.body;
        const guest = await getGuestById(req.params.guestId);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        await updateRsvpStatusGuest(req.params.guestId, rsvpStatus);
        const response = await getGuestById(req.params.guestId);
        return res.status(200).json(response);
    } catch (error) {
        console.error('UPDATE RSVP GUEST ERROR:', error.message);
        next(error)
    }
};

const deleteGuest = async (req, res, next) => {
    try {
        const guest = await getGuestAndInvitationRelatedById(req.params.guestId);
        //console.log('guest:', guest);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        await delete_guest(req.params.guestId);
        await deleteGuestFiles(guest.guest_id, guest.invitationToken);
        return res.status(200).json({message: `Invité ${req.params.guestId} supprimé avec succès!`});
    } catch (error) {
        console.error('DELETE GUEST ERROR:', error.message);
        next(error);
    }
};

const deleteSeveralGuests = async (req, res, next) => {
    try {
        if (req.body.length==0) return res.status(404).json({error: "Liste vide"});
        let guestIdList = req.body;
        //console.log('guestIdList:', guestIdList);
        let returnDatas = [];
        for (const key in guestIdList) {
            const id = guestIdList[key];
            const guest = await getGuestAndInvitationRelatedById(id);
            if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
            await delete_guest(id);
            await deleteGuestFiles(guest.guest_id, guest.invitationToken);
            returnDatas.push(id);
        }
        return res.status(200).json({message: `Les Invités ${returnDatas} ont été supprimé avec succès!`});
    } catch (error) {
        console.error('DELETE GUEST ERROR:', error.message);
        next(error);
    }
}

const sendReminder = async (req, res, next) => {
    try {
        if (req.body.length==0) return res.status(404).json({error: "Liste vide"});
        let guests = req.body;
        for (const key in guests) {
            const guestId = guests[key];
            const event = await getGuestAndInvitationRelatedById(guestId);
            const guest = event;
            await sendReminderMail(guest, event);
        }
        return res.status(200).json({success: "Email de rappel envoyé avec success!"})
    } catch (error) {
        next(error)
    }
}

const sendFileQRCode = async (req, res, next) => {
    try {
        const event = await getGuestAndInvitationRelatedById(req.params.guestId);
        const guest = event;
        await sendFileQRCodeMail(guest, guest.qrCodeUrl);
        return res.status(200).json({success: "Fichier Qr-Code envoyé avec success!"})
    } catch (error) {
        next(error)
    }
}

module.exports = {addGuest, getGuest, getGuestsByEvent, updateGuest, getEventByGuest, updateRsvpStatus, deleteGuest, 
                  deleteSeveralGuests, getAllGuest, sendReminder, sendFileQRCode};