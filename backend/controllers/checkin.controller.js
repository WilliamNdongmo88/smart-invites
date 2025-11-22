const { createCheckin } = require("../models/checkins");
const { getEventById } = require("../models/events");
const { getGuestById, getEventByGuestId } = require("../models/guests");
const { getInvitationById } = require("../models/invitations");
const { getUserById } = require("../models/users");
const { validateAndUseInvitation } = require("../services/invitation.service");
const { sendGuestPresenceToOrganizer } = require("../services/notification.service");

const addCheckIn = async (req, res, next) => {
    try {
        let isValid = false;
        const {eventId, invitationId, guestId, scannedBy, scanStatus, checkinTime} = req.body;
        const event = await getEventById(eventId);
        if(!event) return res.status(404).json({error: "Event non trouvé !"});
        const invitation = await getInvitationById(invitationId);
        if(!invitation) return res.status(404).json({error: "Invitation non trouvé !"});
        if(invitation[0].status=='USED') return res.status(409).json({error: "Code Qr déjà utilisé !"});
        const checkin = await createCheckin(eventId, invitationId, scannedBy, scanStatus, checkinTime);
        if (checkin) {
            await validateAndUseInvitation(invitation);
            isValid = true;
        }
        if (isValid) {
            const guest = await getGuestById(guestId);
            const event = await getEventByGuestId(guestId);
            const organizer = await getUserById(event[0].organizerId);
            await sendGuestPresenceToOrganizer(organizer, guest);
        }
        
        return res.status(201).json(checkin);
    } catch (error) {
        console.log('ADD CHECKIN ERROR:', error.message);
        next(error)
    }
}

module.exports = {addCheckIn};