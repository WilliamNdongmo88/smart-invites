const { createCheckin, getCheckinByInvitationId, updateCheckin } = require("../models/checkins");
const { getEventById } = require("../models/events");
const { getGuestById, getEventByGuestId, updateRsvpStatusGuest, getAllPresentGuest } = require("../models/guests");
const { getInvitationById } = require("../models/invitations");
const { getUserById } = require("../models/users");
const { validateAndUseInvitation } = require("../services/invitation.service");
const { sendGuestPresenceToOrganizer,sendThankYouMailToPresentGuests,
    notifyOrganizerAboutSendThankYouMailToPresentGuests} = require("../services/notification.service");
const schedule = require('node-schedule');

const addCheckIn = async (req, res, next) => {
    try {
        console.log("###body: ", req.body);
        let isValid = false;
        const {eventId, invitationId, guestId, scannedBy, scanStatus, checkinTime} = req.body;
        const existing = await getCheckinByInvitationId(invitationId);
        if (!existing) {
            const event = await getEventById(eventId);
            if(!event) return res.status(404).json({error: "Event non trouvé !"});
            const invitation = await getInvitationById(invitationId);
            if(!invitation) return res.status(404).json({error: "Invitation non trouvé !"});
            if(invitation[0].status=='USED') return res.status(409).json({error: "Code Qr déjà utilisé !"});
            const checkin = await createCheckin(eventId, invitationId, scannedBy, scanStatus, checkinTime);
            if (checkin) {
                await validateAndUseInvitation(invitation);
                await updateRsvpStatusGuest(guestId, 'present');
                isValid = true;
            }
            if (isValid) {
                const guest = await getGuestById(guestId);
                const event = await getEventByGuestId(guestId);
                const organizer = await getUserById(event[0].organizerId);
                await sendGuestPresenceToOrganizer(organizer, guest);

                // Sensé s'executé le lendemain du jour de l'événement.
                planSchedule(event[0], organizer, guest);
            }
            
            return res.status(201).json(checkin);
        } else {
            let checkinId = existing.id;
            existing.scan_status = 'DUPLICATE';
            await updateCheckin(checkinId, eventId, invitationId, scannedBy, existing.scan_status, checkinTime);
            return res.status(409).json({error: "Code Qr déjà utilisé !"});
        }
    } catch (error) {
        console.log('ADD CHECKIN ERROR:', error.message);
        next(error)
    }
}

// Planifier la tâche
function planSchedule(event, organizer, guest) {
        console.log('[schedule 2] date:', event.eventDate);
    const date = formatDate(event.eventDate);

    // on passe une fonction anonyme qui appelle notre fonction async
    schedule.scheduleJob(date, async () => {
        console.log('=== Job déclenché ===');
        await sendScheduledThankMessage(event, organizer, guest);
    });
}

async function sendScheduledThankMessage(event, organizer, guest) {
    try {
        let isOk = false;
        console.log('[1] guest.rsvpStatus:', guest.rsvp_status);
        const guests = await getAllPresentGuest(guest.id);
        for (const guest of guests) {
           isOk =  await sendThankYouMailToPresentGuests(event, guest);
        }
        if(isOk){
            await notifyOrganizerAboutSendThankYouMailToPresentGuests(organizer);
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi du mail:", error);
    }
}

function formatDate(iso){
    let d = new Date(iso);

    // Ajouter 1 jour
    d.setUTCDate(d.getUTCDate() + 1);

    // Maintenant on décompose
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth(); // 0–11
    const day = d.getUTCDate();
    const hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const seconds = d.getUTCSeconds();

    const result = new Date(year, month, day, hours, minutes, seconds);

    return result;
}

module.exports = {addCheckIn, sendScheduledThankMessage};