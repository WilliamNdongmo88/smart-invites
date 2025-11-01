const { v4: uuidv4 } = require('uuid');
const { getGuestById } = require("../models/guests");
const {createInvitation, getGuestInvitationById} = require('../models/invitations');
const { generateGuestQr } = require("../services/qrCodeService");
const { generateGuestPdf, uploadPdfToFirebase } = require("../services/pdfService");
const { bucket } = require('../config/firebaseConfig');

const genererInvitation = async (req, res) => {
  try {
    const guest = await getGuestById(req.params.guestId);
    if (!guest) return res.status(404).json({ error: "Invité introuvable" });

    const invitations = await getGuestInvitation(req.params.guestId);
    console.log('Invitation:', invitations);
    if (invitations[0]) return res.status(409).json({ error: "Invitation déjà invoyé a cet invité" });
    
    const token = uuidv4();
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

        const invitations = await getGuestInvitation(req.params.guestId);
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
        res.status(500).send("Erreur interne du serveur.");
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
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

module.exports = {genererInvitation, viewInvitation, viewQrCode};
