const { getEventById, getGuestEmailRelatedToEvent} = require('../models/events');
const { deleteGuestFiles } = require('../services/invitation.service');
const {
        createGuest, getGuestById, getAllGuestAndInvitationRelatedByEventId,
        update_guest, updateRsvpStatusGuest, delete_guest, getGuestByEmail,
        getAllGuestAndInvitationRelated,getGuestAndInvitationRelatedById,
        getEventByGuestId
    } = require('../models/guests');

const addGuest = async (req, res, next) => {
    try {
        if (req.body.length==0) return res.status(404).json({error: "Liste vide"});
        let guestDatas = req.body;
        // console.log('guestDatas :: ', guestDatas);
        const event = await getEventById(guestDatas[0].eventId);
        // console.log('#### event :: ', event);
        if(!event) return res.status(401).json({error: `Evénement avec l'id ${event.id} non trouvé!`});
        let returnDatas = [];
        for (const key in guestDatas) {
            const data = guestDatas[key];
            const {
                eventId,
                fullName,
                email,
                phoneNumber,
                rsvpStatus,
                hasPlusOne} = data;
            // console.log('hasPlusOne :: ', hasPlusOne, ' | type:', typeof hasPlusOne);
            const result = await getGuestEmailRelatedToEvent(email, event.id);
            console.log('result :: ', result);
            if(result) return res.status(409).json({error: `L'invité ${email} existe déjà`});
            const guestId = await createGuest(eventId, fullName, email, phoneNumber, 
                                              rsvpStatus, hasPlusOne);
            returnDatas.push({id: guestId, eventId, fullName, email, phoneNumber, 
                              rsvpStatus, hasPlusOne});
        }
        return res.status(201).json(returnDatas);
    } catch (error) {
        console.error('CREATE GUEST ERROR:', error.message);
        next(error);
    }
};

const getAllGuest = async (req, res, next) => {
    try {
        const guests = await getAllGuestAndInvitationRelated();
        if(!guests[0]) return res.status(401).json({error: "Aucun invité trouvé!"});
        return res.status(200).json({guests}); 
    } catch (error) {
        console.error('GET GUEST ERROR:', error.message);
        next(error);
    }
};

const getGuest = async (req, res, next) => {
    try {
        const guest = await getGuestAndInvitationRelatedById(req.params.guestId);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        return res.status(200).json({guest}); 
    } catch (error) {
        console.error('GET GUEST ERROR:', error.message);
        next(error);
    }
};

const getEventByGuest = async (req, res, next) => {
    try {
        const result = await getEventByGuestId(req.params.guestId);
        if(!result) return res.status(404).json({error: "Invité non trouvé!"});
        return res.status(200).json(result[0]);
    } catch (error) {
        next(error);
    }
}

const getGuestsByEvent = async (req, res) => {
    try {
        const guests = await getAllGuestAndInvitationRelatedByEventId(req.params.eventId);
        if(guests.length == 0) return res.status(401).json({error: "Aucun invité n'est lié a cette événement! "});
        return res.status(200).json({guests});
    } catch (error) {
        console.error('GET EVENT GUEST ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const updateGuest = async (req, res, next) => {
    try {
        let {
            eventId, fullName, email, phoneNumber, 
            rsvpStatus, hasPlusOne, plusOneName, notes} = req.body;
        const guest = await getGuestById(req.params.guestId);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        if(eventId==null) eventId = guest.event_id;
        if(fullName==null) fullName = guest.full_name;
        if(email==null) email = guest.email;
        if(phoneNumber==null) phoneNumber = guest.phone_number;
        if(rsvpStatus==null) rsvpStatus = guest.rsvp_status;
        if(hasPlusOne==null) hasPlusOne = guest.has_plus_pne;
        if(plusOneName==null) plusOneName = guest.plus_one_name;
        if(notes==null) notes = guest.notes;
        await update_guest(req.params.guestId, eventId, fullName, email, phoneNumber, 
            rsvpStatus, hasPlusOne, plusOneName, notes);
        const updatedGuest = await getGuestById(req.params.guestId);
        return res.status(200).json({updatedGuest});
    } catch (error) {
        console.error('UPDATE GUEST ERROR:', error.message);
        next(error);
    }
}

const updateRsvpStatus = async (req, res, next) => {
    try {
        const {rsvpStatus} = req.body;
        const guest = await getGuestById(req.params.guestId);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        await updateRsvpStatusGuest(req.params.guestId, rsvpStatus);
        const updatedGuest = await getGuestById(req.params.guestId);
        return res.status(200).json({updatedGuest});
    } catch (error) {
        console.error('UPDATE RSVP GUEST ERROR:', error.message);
        next(error)
    }
};

const deleteGuest = async (req, res, next) => {
    try {
        const guest = await getGuestAndInvitationRelatedById(req.params.guestId);
        console.log('guest:', guest);
        console.log('Id et Token:', guest[0].guest_id + ' || ' + guest[0].token);
        if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
        await delete_guest(req.params.guestId);
        await deleteGuestFiles(guest[0].guest_id, guest[0].token);
        return res.status(200).json({message: `Invité ${req.params.guestId} supprimé avec succès!`});
    } catch (error) {
        console.error('DELETE GUEST ERROR:', error.message);
        next(error);
    }
};

const deleteSeveralGuests = async (req, res, next) => {
    try {
        if (req.body.length==0) return res.status(404).json({error: "Liste vide"});
        let guestIdList = req.body;
        console.log('guestIdList:', guestIdList);
        let returnDatas = [];
        for (const key in guestIdList) {
            const id = guestIdList[key];
            const guest = await getGuestAndInvitationRelatedById(id);
            console.log('guest:', guest);
            console.log('Id et Token:', guest[0].guest_id + ' || ' + guest[0].token);
            if(!guest) return res.status(401).json({error: "Aucun invité trouvé!"});
            await delete_guest(id);
            await deleteGuestFiles(guest[0].guest_id, guest[0].token);
            returnDatas.push(id);
        }
        return res.status(200).json({message: `Les Invités ${returnDatas} ont été supprimé avec succès!`});
    } catch (error) {
        console.error('DELETE GUEST ERROR:', error.message);
        next(error);
    }
}

module.exports = {addGuest, getGuest, getGuestsByEvent, updateGuest, getEventByGuest,
                  updateRsvpStatus, deleteGuest, deleteSeveralGuests, getAllGuest};
