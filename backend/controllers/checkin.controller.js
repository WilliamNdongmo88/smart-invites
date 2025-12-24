const { createCheckin, getCheckinByInvitationId, updateCheckin, getEventAndGuestInfoByGuestId } = require("../models/checkins");
const { getEventScheduleById } = require("../models/event_schedules");
const { getEventById } = require("../models/events");
const { getGuestById, getEventByGuestId, updateRsvpStatusGuest, getAllPresentGuest } = require("../models/guests");
const { getInvitationById, getGuestInvitationByToken } = require("../models/invitations");
const { createNotification } = require("../models/notification");
const { getUserById } = require("../models/users");
const { validateAndUseInvitation } = require("../services/invitation.service");
const { sendGuestPresenceToOrganizer,sendThankYouMailToPresentGuests
      } = require("../services/notification.service");
const schedule = require('node-schedule');

const addCheckIn = async (req, res, next) => {
    try {
        //console.log("###body: ", req.body);
        let isValid = false;
        const {eventId, invitationId, guestId, token, scannedBy, scanStatus, checkinTime} = req.body;
        if(token=='undefined:undefined') return res.status(404).json({error: "Code Qr invalide !"});
        const existingInvitation = await getGuestInvitationByToken(token);
        if(existingInvitation.length==0) return res.status(404).json({error: "Code Qr invalide !"});
        const existing = await getCheckinByInvitationId(invitationId);
        if (!existing) {
            const event = await getEventById(eventId);
            if(!event) return res.status(404).json({error: "Event non trouvé !"});
            const invitation = await getInvitationById(invitationId);
            if(!invitation) return res.status(404).json({error: "Invitation non trouvé !"});
            if(invitation[0].status=='USED') return res.status(409).json({error: "Code Qr déjà utilisé !"});
            const checkin = await createCheckin(eventId, guestId, invitationId, scannedBy, scanStatus, checkinTime);
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
                await createNotification(
                    event[0].eventId,
                    `Arrivé Invité ${guest.full_name}`,
                    `L'invité ${guest.full_name} vient d'arriver.`,
                    'info',
                    false
                );
                // Planification (Sensé s'exécuter le lendemain du jour de l'événement)
                const schedules = await getEventScheduleById(eventId);
                //console.log('Executed ? ', schedules.executed);
                if (!schedules.executed) {
                    planSchedule(event[0], schedules, organizer, guest);
                }
            }
            const event_and_guest_datas = await getEventAndGuestInfoByGuestId(guestId);
            console.log('event_and_guest_datas:', event_and_guest_datas);
            return res.status(201).json(event_and_guest_datas);
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
function planSchedule(event, schedules, organizer, guest) {
    //console.log('[schedule 2] date:', schedules.scheduled_for);
    const date = formatDate(schedules.scheduled_for);
    
    // on passe une fonction anonyme qui appelle notre fonction async
    schedule.scheduleJob(date, async () => {
        //console.log('=== Job déclenché ===');
        await sendScheduledThankMessage(event, schedules, organizer, guest);
    });
}

async function sendScheduledThankMessage(event, schedules, organizer, guest) {
    try {
        console.log('[2] guest.rsvpStatus:', guest.rsvp_status);
        const guests = await getAllPresentGuest(guest.id);
        if (!guests || guests.length === 0) {
            console.log("Aucun invité présent trouvé.");
            return;
        }
        // Envoi des mails en parallèle contrôlée (plus rapide)
        await Promise.all(
            guests.map(g => sendThankYouMailToPresentGuests(event, schedules, organizer, g))
        );
    } catch (error) {
        console.error("Erreur lors de l'envoi du mail:", error);
    }
}

function formatDate(iso){
    let d = new Date(iso);

    // Ajouter 1 jour
    d.setDate(d.getDate() + 1);

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