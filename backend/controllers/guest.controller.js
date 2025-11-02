const { getEventById } = require('../models/events');
const {
        createGuest, getGuestById, getGuestByEventId,
        update_guest, updateRsvpStatusGuest, delete_guest,
        getGuestAndInvitationRelatedById
    } = require('../models/guests');

const addGuest = async (req, res) => {
    try {
        const {
            eventId,
            fullName,
            email,
            phoneNumber,
            rsvpStatus,
            hasPlusOne,
            plusOneName,
            notes} = req.body;
        const event = await getEventById(eventId);
        if(!event) return res.status(401).json({error: `Evénement avec l'id ${eventId} non trouvé!`});
        const guest = await createGuest(eventId, fullName, email, phoneNumber, 
            rsvpStatus, hasPlusOne, plusOneName, notes);
        return res.status(201).json({eventId, fullName, email, phoneNumber, 
            rsvpStatus, hasPlusOne, plusOneName, notes});
    } catch (error) {
        console.error('CREATE GUEST ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getGuest = async (req, res) => {
    try {
        // const guest = await getGuestById(req.params.guestId);
        const guest = await getGuestAndInvitationRelatedById(req.params.guestId);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        return res.status(200).json({guest}); 
    } catch (error) {
        console.error('GET GUEST ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getGuestsByEvent = async (req, res) => {
    try {
        const guests = await getGuestByEventId(req.params.eventId);
        if(guests.length == 0) return res.status(401).json({error: "Aucun invité n'est lié a cette événement! "});
        return res.status(200).json({guests});
    } catch (error) {
        console.error('GET EVENT GUEST ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const updateGuest = async (req, res) => {
    try {
        const {
            eventId,
            fullName,
            email,
            phoneNumber,
            rsvpStatus,
            hasPlusOne,
            plusOneName,
            notes} = req.body;
        const guest = await getGuestById(req.params.guestId);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        await update_guest(req.params.guestId, eventId, fullName, email, phoneNumber, 
            rsvpStatus, hasPlusOne, plusOneName, notes);
        const updatedGuest = await getGuestById(req.params.guestId);
        return res.status(200).json({updatedGuest});
    } catch (error) {
        console.error('UPDATE GUEST ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

const updateRsvpStatus = async (req, res) => {
    try {
        const {rsvpStatus} = req.body;
        const guest = await getGuestById(req.params.guestId);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        await updateRsvpStatusGuest(req.params.guestId, rsvpStatus);
        const updatedGuest = await getGuestById(req.params.guestId);
        return res.status(200).json({updatedGuest});
    } catch (error) {
        console.error('UPDATE RSVP GUEST ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const deleteGuest = async (req, res) => {
    try {
        const guest = await getGuestById(req.params.guestId);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        await delete_guest(req.params.guestId);
        return res.status(200).json({message: `Invité ${req.params.guestId} supprimé avec succès!`});
    } catch (error) {
        console.error('DELETE GUEST ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

module.exports = {addGuest, getGuest, getGuestsByEvent, updateGuest, updateRsvpStatus, deleteGuest};
