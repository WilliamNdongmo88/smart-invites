const { v4: uuidv4 } = require('uuid');
const { getGuestById } = require("../models/guests");
const {createInvitation, getGuestInvitation, getGuestInvitationByToken} = require('../models/invitations');
const {generateQrCodeUrl} = require('../services/invitation.service');

const genererInvitation = async (req, res) => {
    try {
        const guest = await getGuestById(req.params.guestId);
        if(!guest) return res.status(401).json({error: `Aucun invité avec l'id ${req.params.guestId} trouvé`});

        const invite = await getGuestInvitation(req.params.guestId);
        if(invite) return res.status(409).json({error: `Invitation déjà envoyé pour cet invité`});

        // Generate unique token
        const token = uuidv4();
        console.log('token ::', token);
        // Generate QR code URL 
        const data = await generateQrCodeUrl(token);
        console.log('data:', data);
        const invitationId = await createInvitation(req.params.guestId, token, data.publicUrl);
        console.log('invitationId:', invitationId);
        return res.status(201).json({invitationId, token, qrCodeUrl})
        // res.setHeader('Content-Type', 'image/png');
        // res.send(data.buffer);
    } catch (error) {
        console.error('CREATE INVITATION ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const viewQrCode = async (req, res) => {
    try {
        const result = await getGuestInvitationByToken(req.params.token);
        if(!result) return res.status(401).json({error: `Aucun invité trouvé`});
        
        console.log('result:', result);
        return res.status(200).json({qrCodeUrl: result[0].qr_code_url})
    } catch (error) {
        console.error('GET INVITATION ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

module.exports = {genererInvitation, viewQrCode};
