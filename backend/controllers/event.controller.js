const {getUserById} = require('../models/users');
const {createEvent, getEventById,updateEvent,updateEventStatus,getEventsByOrganizerId,
getEventWithTotalGuest, deleteEvents, getEventWithTotalGuestById} = require('../models/events')

const create_Event = async (req, res, next) => {
    try {
        console.log('req.body: ', req.body) ;
        const { 
            organizerId,title,description,eventDate,eventLocation, 
            maxGuests, hasPlusOne, footRestriction, status} = req.body;
        const existing = await getUserById(organizerId);
        if (!existing) return res.status(409).json({ error: "Organizer not found with ID: " + organizerId });
        const eventId = await createEvent(organizerId, title, description, eventDate, 
            eventLocation, maxGuests,hasPlusOne, footRestriction, status);
        return res.status(201).json({ id: eventId, organizerId, title, description, eventDate, 
            eventLocation, maxGuests, hasPlusOne, footRestriction, status });
    } catch (error) {
        console.error('CREATE EVENT ERROR:', error.message);
        next(error);
    }
};

const getAllEvents = async (req, res, next) => {
    try {
        const result = await getEventWithTotalGuest();
        if(!result) return res.status(404).json({error: "Aucun Evénement trouvé!"});
        return res.status(200).json({result});
    } catch (error) {
        console.error('GET EVENT BY ID ERROR:', error.message);
        next(error);
    }
}

  const getEventBy_Id = async (req, res, next) => {
    try {
        const event = await getEventWithTotalGuestById(req.params.eventId);
        // console.log('event:', event);
        if(!event) res.status(404).json({ error: 'Aucun Evénement trouvé' });
        console.log("### event :: ", event);
        return res.status(200).json({ event });
    } catch (error) {
        console.error('GET EVENT BY ID ERROR:', error.message);
        next(error);
    }
  };

  const getOrganizerEvents = async (req, res, next) => {
    try {
        const organizerEvent = await getEventsByOrganizerId(req.params.organizerId);
        if(organizerEvent.length == 0) return res.status(404).json({ error: 'Aucun Evénement trouvé' });
        console.log('organizerEvent:', organizerEvent);
        return res.status(200).json({ events: organizerEvent });
    } catch (error) {
        console.error('GET EVENT BY OrganizerID ERROR:', error.message);
        next(error);
    }
  }

  const updateEventBy_Id = async (req, res, next) => {
    try {
        let { organizerId, title, description, eventDate, 
            eventLocation, maxGuests, hasPlusOne, footRestriction, status 
        } = req.body;

        const event = await getEventById(req.params.eventId);
        if(!event) return res.status(404).json({error: "Cet Evénement n'existe pas"});

        if(organizerId == null){ organizerId = event.organizer_id};
        if(title == null){ title = event.title};
        if(description == null){ description = event.description};
        if(eventDate == null){ eventDate = event.event_date};
        if(eventLocation == null){ eventLocation = event.event_location};
        if(maxGuests == null){ maxGuests = event.max_guests};
        if(hasPlusOne == null){ hasPlusOne = event.has_plus_one};
        if(footRestriction == null){ footRestriction = event.foot_restriction};
        if(status == null){ status = event.status};

        const organizer = await getUserById(organizerId);
        if(!organizer) return res.status(404).json({error: "Organizer non trouvé!"})
        await updateEvent(req.params.eventId, organizerId, title, description, eventDate, 
            eventLocation, maxGuests, hasPlusOne, footRestriction, status );
        const updatedEvent = await getEventById(req.params.eventId)
        return res.status(200).json({updatedEvent})
    } catch (error) {
        console.error('UPDATE EVENT BY ID ERROR:', error.message);
        next(error);
    }
  };

  const updateEvent_Status = async (req, res, next) => {
    try {
        const {status} = req.body;
        const event = await getEventById(req.params.eventId);
        if(!event) return res.status(404).json({error: `Aucun Evénement trouvé avec l'id: ${req.params.eventId}`});
        await updateEventStatus(req.params.eventId, status);
        const updatedEvent = await getEventById(req.params.eventId);
        return res.status(200).json({updatedEvent});
    } catch (error) {
        console.error('UPDATE STATUS EVENT ERROR:', error.message);
        next(error);
    }
  };

  const deleteEvent = async (req, res, next) => {
    try {
        const event = await getEventById(req.params.eventId);
        if(!event) return res.status(404).json({error: `Evénement non trouvé!`});
        await deleteEvents(req.params.eventId);
        return res.status(200).json({message: `Evénement ${req.params.eventId} supprimé avec succès!`})
    } catch (error) {
        console.error('DELETE EVENT ERROR:', error.message);
        next(error);
    }
  }

module.exports = {
    create_Event,
    getAllEvents, 
    getEventBy_Id,
    getOrganizerEvents,
    updateEventBy_Id,
    updateEvent_Status,
    deleteEvent
}