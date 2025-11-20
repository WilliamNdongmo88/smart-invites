const { createCheckin } = require("../models/checkins");
const { getEventById } = require("../models/events");
const { getInvitationById } = require("../models/invitations");

const addCheckIn = async (req, res, next) => {
    try {
        const {eventId, invitationId, scannedBy, scanStatus, checkinTime} = req.body;
        const event = await getEventById(eventId);
        if(!event) return res.status(404).json({error: "Event non trouvé !"});
        const invitation = await getInvitationById(invitationId);
        if(!invitation) return res.status(404).json({error: "Invitation non trouvé !"});
        const checkin = await createCheckin(eventId, invitationId, scannedBy, scanStatus, checkinTime);
        await validateAndUseInvitation(invitation);
        return res.status(201).json(checkin);
    } catch (error) {
        console.log('ADD CHECKIN ERROR:', error.message);
        next(error)
    }
}

module.exports = {addCheckIn};