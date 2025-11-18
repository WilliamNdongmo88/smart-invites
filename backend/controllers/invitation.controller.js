const { v4: uuidv4 } = require('uuid');
const { getGuestById, updateRsvpStatusGuest, getGuestAndEventRelatedById} = require("../models/guests");
const {createInvitation, getGuestInvitationById, 
    getGuestInvitationByToken, deleteGuestInvitation} = require('../models/invitations');
const { generateGuestQr } = require("../services/qrCodeService");
const { generateGuestPdf, uploadPdfToFirebase } = require("../services/pdfService");
const {deleteGuestFiles} = require('../services/invitation.service');
const {sendGuestEmail} = require('../services/notification.service');
const { bucket } = require('../config/firebaseConfig');

const genererSeveralInvitations = async (req, res, next) => {
  try {
    if (req.body.length==0) return res.status(404).json({error: "Liste vide"});
    let guestsIdList = req.body;
    let returnDatas = [];
    for (const key in guestsIdList) {
        const guestId = guestsIdList[key];
        const guest = await getGuestById(guestId);
        if (!guest) return res.status(404).json({ error: `Invité ${guestId} introuvable` });
        const guest_event_related = await getGuestAndEventRelatedById(guestId);
        if (!guest_event_related[0].event_title) return res.status(404).json({ error: "Donnée introuvable" });
        const invitations = await getGuestInvitationById(guestId);
        if (invitations[0]) return res.status(409).json({ error: `Invitation déjà invoyé a l'invité ${guestId}` });
        let token = guestId +':'+ uuidv4();
        const qrUrl = await generateGuestQr(guest.id, token, "wedding-ring.jpg");
        const buffer = await generateGuestPdf(guest_event_related[0]);
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
    const qrUrl = await generateGuestQr(guest.id, token, "wedding-ring.jpg");
    const buffer = await generateGuestPdf(guest_event_related[0]);
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
        //console.log('guestId:', req.params.guestId);
        const guest = await getGuestById(req.params.guestId);
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
            const buffer = await generateGuestPdf(guest);
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
        const result = await getGuestInvitationById(req.params.guestId);
        if(!result) return res.status(401).json({error: `Aucun invité trouvé`});
        
        //console.log('result:', result);
        return res.status(200).json({qrCodeUrl: result[0].qr_code_url})
    } catch (error) {
        console.error('GET INVITATION ERROR:', error.message);
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
        await deleteGuestInvitation(req.params.guestId);
        await deleteGuestFiles(req.params.guestId, invitation[0].token);
        return res.status(200).json({message: "Invitation supprimé avec succès"});
    } catch (error) {
        console.error('DELETE INVITATION ERROR:', error.message);
        next(error);
    }
}

module.exports = {genererInvitation, genererSeveralInvitations, viewInvitation, viewQrCode, 
                    rsvpGuestStatus, deleteInvitation
                };
