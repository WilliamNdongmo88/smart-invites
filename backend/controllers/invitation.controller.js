const { v4: uuidv4 } = require('uuid');
const { getGuestById, updateRsvpStatusGuest} = require("../models/guests");
const {createInvitation, getGuestInvitationById, 
    getGuestInvitationByToken, deleteGuestInvitation} = require('../models/invitations');
const { generateGuestQr } = require("../services/qrCodeService");
const { generateGuestPdf, uploadPdfToFirebase } = require("../services/pdfService");
const {deleteGuestFiles} = require('../services/invitation.service');
const { bucket } = require('../config/firebaseConfig');

const genererInvitation = async (req, res) => {
  try {
    const guest = await getGuestById(req.params.guestId);
    if (!guest) return res.status(404).json({ error: "Invité introuvable" });

    const invitations = await getGuestInvitationById(req.params.guestId);
    // console.log('Invitation:', invitations);
    if (invitations[0]) return res.status(409).json({ error: "Invitation déjà invoyé a cet invité" });
    
    let token =req.params.guestId +':'+ uuidv4();
    const qrUrl = await generateGuestQr(guest.id, token, "wedding-ring.jpg");
    const buffer = await generateGuestPdf(guest);
    const pdfUrl = await uploadPdfToFirebase(guest, buffer);

    await createInvitation(req.params.guestId, token, qrUrl);

    return res.json({ message: "QR code et PDF générés", qrUrl, pdfUrl });
  } catch (err) {
    console.error("Erreur génération :", err);
    res.status(500).json({ error: err.message });
  }
};

const viewInvitation = async (req, res) => {
    try {
        console.log('guestId:', req.params.guestId);
        const guest = await getGuestById(req.params.guestId);
        if (!guest) return res.status(404).send("Invité introuvable");

        const invitations = await getGuestInvitationById(req.params.guestId);
        if (!invitations[0]) return res.status(401).json({ error: "Aucune invitation n'a été envoyé a cet invité" });

        const file = bucket.file(`pdfs/carte_${guest.id}.pdf`);
        const [exists] = await file.exists();

        if (exists) {
            // 🔸 Sert le PDF déjà généré
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "inline; filename=invitation.pdf");
            file.createReadStream().pipe(res);
        } else {
            // 🔸 Sinon, génère et renvoie à la volée
            const buffer = await generateGuestPdf(guest);
            const pdfUrl = await uploadPdfToFirebase(guest, buffer);
            console.log('pdfUrl:', pdfUrl);
            res.redirect(pdfUrl);
        }
    } catch (error) {
        console.error("Erreur affichage carte:", error);
        res.status(500).json({ error: err.message });
    }
}

const viewQrCode = async (req, res) => {
    try {
        const result = await getGuestInvitationById(req.params.guestId);
        if(!result) return res.status(401).json({error: `Aucun invité trouvé`});
        
        console.log('result:', result);
        return res.status(200).json({qrCodeUrl: result[0].qr_code_url})
    } catch (error) {
        console.error('GET INVITATION ERROR:', error.message);
         res.status(500).json({ error: err.message });
    }
};

const rsvpGuestStatus = async (req, res) => {
    try {
        const {rsvpStatus} = req.body;
        const invitation = await getGuestInvitationByToken(req.params.token);
        // console.log('invitation:', invitation);
        if(!invitation[0]) return res.status(404).json({error: "Invitation non trouvé"});
        await updateRsvpStatusGuest(invitation[0].guest_id, rsvpStatus.toUpperCase());
        return res.status(200).json({message: "Rsvp Status mis a jous avec succès!"});
    } catch (error) {
        console.error('RSVP STATUS GUEST ERROR:', error.message);
         res.status(500).json({ error: err.message });
    }
};

const deleteInvitation = async (req, res) => {
    try {
        const invitation = await getGuestInvitationById(req.params.guestId);
        if(!invitation[0]) return res.status(404).json({error: "Invitation non trouvé!"});
        await deleteGuestInvitation(req.params.guestId);
        await deleteGuestFiles(req.params.guestId, invitation[0].token);
        return res.status(200).json({message: "Invitation supprimé avec succès"});
    } catch (error) {
        console.error('DELETE INVITATION ERROR:', error.message);
         res.status(500).json({ error: err.message });
    }
}

module.exports = {genererInvitation, viewInvitation, viewQrCode, 
                    rsvpGuestStatus, deleteInvitation
                };
