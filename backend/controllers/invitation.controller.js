const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { getGuestById, updateRsvpStatusGuest, getGuestAndEventRelatedById, getEventByGuestId} = require("../models/guests");
const {createInvitation, getGuestInvitationById, 
    getGuestInvitationByToken, deleteGuestInvitation} = require('../models/invitations');
const { generateGuestQr, getLogoUrlFromFirebase } = require("../services/qrCodeService");
const { generateGuestPdf, uploadPdfToFirebase } = require("../services/pdfService");
const {deleteGuestFiles} = require('../services/invitation.service');
const {sendGuestEmail} = require('../services/notification.service');
const { update_guest } = require('../models/guests');
const { bucket } = require('../config/firebaseConfig');
const { getEventById } = require('../models/events');
const { getEventInvitNote } = require('../models/event_invitation_notes');

const genererSeveralInvitations = async (req, res, next) => {
  try {
    if (req.body.length==0) return res.status(404).json({error: "Liste vide"});
    let guestsIdList = req.body;
    let returnDatas = [];
    for (const guestId of guestsIdList) {
        const guest = await getGuestById(guestId);
        if (!guest) return res.status(404).json({ error: `Invité ${guestId} introuvable` });
        const guest_event_related = await getGuestAndEventRelatedById(guestId);
        if (!guest_event_related[0].event_title) return res.status(404).json({ error: "Donnée introuvable" });
        const invitations = await getGuestInvitationById(guestId);
        if (invitations[0]) return res.status(409).json({ error: `Invitation déjà invoyé a l'invité ${guestId}` });
        let token = guestId +':'+ uuidv4();
        const qrUrl = await generateGuestQr(guest.id, token, "wedding-ring.webp");
        const event = await getEventByGuestId(guest.id);
        const card = await getEventInvitNote(event[0].eventId);
        const buffer = await generateGuestPdf(guest_event_related[0], card);
        const pdfUrl = await uploadPdfToFirebase(guest, buffer);
        try {
            await sendGuestEmail(guest, guest_event_related[0], token);
        } catch (error) {
            console.error("SEND EMAIL ERROR:", error.message);
            next(error);
        }
        await createInvitation(guestId, token, qrUrl);
        returnDatas.push({message: "QR code et PDF générés", id: guestId, qrUrl, pdfUrl});
    }
    return res.json(returnDatas);
  } catch (err) {
    console.error("Erreur génération :", err.message);
    next(err)
  }
};

const genererInvitation = async (req, res, next) => {
  try {
    const guest = await getGuestById(req.params.guestId);
    if (!guest) return res.status(404).json({ error: "Invité introuvable" });
    const guest_event_related = await getGuestAndEventRelatedById(req.params.guestId);
    //console.log('guest_event_related:', guest_event_related[0].event_title);
    if (!guest_event_related[0].event_title) return res.status(404).json({ error: "Donnée introuvable" });
    const invitations = await getGuestInvitationById(req.params.guestId);
    if (invitations[0]) return res.status(409).json({ error: "Invitation déjà invoyé a cet invité" });
    
    let token =req.params.guestId +':'+ uuidv4();
    const qrUrl = await generateGuestQr(guest.id, token, "wedding-ring.webp");
    const event = await getEventByGuestId(guest.id);
    const card = await getEventInvitNote(event[0].eventId);
    const buffer = await generateGuestPdf(guest_event_related[0], card);
    const pdfUrl = await uploadPdfToFirebase(guest, buffer);
    try {
        await sendGuestEmail(guest, guest_event_related[0], token);
    } catch (error) {
        console.error("SEND EMAIL ERROR:", error.message);
        next(error);
    }
    await createInvitation(req.params.guestId, token, qrUrl);

    return res.json({ message: "QR code et PDF générés", qrUrl, pdfUrl });
  } catch (err) {
    console.error("Erreur génération :", err.message);
    next(err)
  }
};

const viewInvitation = async (req, res, next) => {
    try {
        const guest = await getGuestById(req.params.guestId);
        console.log('[viewInvitation] guest:', guest);
        if (!guest) return res.status(404).send("Invité introuvable");

        const invitations = await getGuestInvitationById(req.params.guestId);
        if (!invitations[0]) return res.status(401).json({ error: "Aucune invitation n'a été envoyé a cet invité" });

        const file = bucket.file(`pdfs/carte_${guest.id}.pdf`);
        const [exists] = await file.exists();

        if (exists) {
            // Sert le PDF déjà généré
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "inline; filename=invitation.pdf");
            file.createReadStream().pipe(res);
        } else {
            // Sinon, génère et renvoie à la volée
            const event = await getEventByGuestId(guest.id);
            const card = await getEventInvitNote(event[0].eventId);
            const buffer = await generateGuestPdf(guest, card);
            const pdfUrl = await uploadPdfToFirebase(guest, buffer);
            //console.log('pdfUrl:', pdfUrl);
            res.redirect(pdfUrl);
        }
    } catch (error) {
        console.error("Erreur affichage carte:", error);
        next(error);
    }
}

const viewQrCode = async (req, res, next) => {
    try {
        const result = await getGuestInvitationByToken(req.params.token);
        if(!result) return res.status(401).json({error: `Aucun invité trouvé`});
        if(result[0] && result[0].length!=0){
            const guestId = req.params.token.split(':')[0];
            let logoUrl = '';
            const event = await getEventByGuestId(guestId);
            console.log('[viewQrCode] result:', event);
            if(event[0].type == 'wedding'){
                logoUrl = await getLogoUrlFromFirebase("carte.jpg");
            }else if(event[0].type == 'engagement'){
                logoUrl = await getLogoUrlFromFirebase("carte-fiancailles.png");
            }else if(event[0].type == 'anniversary'){
                logoUrl = await getLogoUrlFromFirebase("carte-anniv-mariage.png");
            }else if(event[0].type == 'birthday'){
                logoUrl = await getLogoUrlFromFirebase("carte-anniv.png");
            }
            return res.status(200).json({ imageUrl: logoUrl });
            //return res.status(200).json({qrCodeUrl: result[0].qr_code_url});
        }else{
            const eventId = req.params.token.split(':')[0];
            let logoUrl = '';
            const event = await getEventById(eventId);
            console.log('[viewQrCode] event:', event);
            if(event.type == 'wedding'){
                logoUrl = await getLogoUrlFromFirebase("carte.jpg");
            }else if(event.type == 'engagement'){
                logoUrl = await getLogoUrlFromFirebase("carte-fiancailles.png");
            }else if(event.type == 'anniversary'){
                logoUrl = await getLogoUrlFromFirebase("carte-anniv-mariage.png");
            }else if(event.type == 'birthday'){
                logoUrl = await getLogoUrlFromFirebase("carte-anniv.png");
            }
            return res.status(200).json({ imageUrl: logoUrl });
        }
    } catch (error) {
        console.error('GET INVITATION ERROR:', error.message);
        next(error);
    }
};

const downloadQRCode = async (req, res, next) => {
    try {
        const response = await axios.get(req.query.url, { responseType: "arraybuffer" });

        res.set({
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="qr-code-${req.params.guestId}.png"`
        });

        res.send(response.data);
    } catch (error) {
        console.error('[downloadQRCode] ERROR:', error.message);
        next(error);
    }
};

const rsvpGuestStatus = async (req, res, next) => {
    try {
        const {rsvpStatus} = req.body;
        const invitation = await getGuestInvitationByToken(req.params.token);
        // console.log('invitation:', invitation);
        if(!invitation[0]) return res.status(404).json({error: "Invitation non trouvé"});
        await updateRsvpStatusGuest(invitation[0].guest_id, rsvpStatus.toUpperCase());
        return res.status(200).json({message: "Rsvp Status mis a jous avec succès!"});
    } catch (error) {
        console.error('RSVP STATUS GUEST ERROR:', error.message);
        next(error);
    }
};

const deleteInvitation = async (req, res, next) => {
    try {
        const invitation = await getGuestInvitationById(req.params.guestId);
        if(!invitation[0]) return res.status(404).json({error: "Invitation non trouvé!"});
        const guest = await getGuestById(req.params.guestId);
        // console.log('guest before delete invitation:', guest);
        if(guest.has_plus_one){
            console.log("guest: ", guest);
            guest.has_plus_one = false;
            guest.plus_one_name = null;
            guest.plus_one_name_diet_restr = null;
            guest.guest_has_plus_one_autorise_by_admin = false;
            guest.rsvp_status = 'pending';
            await update_guest(guest.id, guest.event_id, guest.full_name, null, guest.email, guest.phone_number, guest.rsvp_status, 
                guest.has_plus_one, guest.guest_has_plus_one_autorise_by_admin, guest.plus_one_name, guest.notes, guest.dietary_restrictions, 
                guest.plus_one_name_diet_restr, guest.updated_at);
        }else if(guest.rsvp_status == 'confirmed' || guest.rsvp_status == 'declined'){
            guest.has_plus_one = false;
            guest.plus_one_name = null;
            guest.plus_one_name_diet_restr = null;
            guest.rsvp_status = 'pending';
            await update_guest(guest.id, guest.event_id, guest.full_name, guest.table_number, guest.email, guest.phone_number, guest.rsvp_status, 
                guest.has_plus_one, guest.guest_has_plus_one_autorise_by_admin, guest.plus_one_name, guest.notes, guest.dietary_restrictions, 
                guest.plus_one_name_diet_restr, guest.updated_at);
        }
        await deleteGuestInvitation(req.params.guestId);
        await deleteGuestFiles(req.params.guestId, invitation[0].token);
        return res.status(200).json({message: "Invitation supprimé avec succès"});
    } catch (error) {
        console.error('DELETE INVITATION ERROR:', error.message);
        next(error);
    }
}

module.exports = {genererInvitation, genererSeveralInvitations, viewInvitation, viewQrCode, 
                    rsvpGuestStatus, deleteInvitation, downloadQRCode
                };
