const {getUserById} = require('../models/users');
const {createEvent, getEventById,updateEvent,updateEventStatus,
getEventsByOrganizerId, deleteEvents} = require('../models/events')

const create_Event = async (req, res) => {
    try {
        const { 
            organizerId,
            title,
            description,
            eventDate,
            eventLocation,
            maxGuests,
            status} = req.body;
        const existing = await getUserById(organizerId);
        if (!existing) return res.status(409).json({ error: "Organizer not found with ID: " + organizerId });
        const eventId = await createEvent(organizerId, title, description, eventDate, 
            eventLocation, maxGuests, status);
        return res.status(201).json({ id: eventId, organizerId, title, description, eventDate, 
            eventLocation, maxGuests, status });
    } catch (error) {
        console.error('CREATE EVENT ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

  const getEventBy_Id = async (req, res) => {
    try {
        const event = await getEventById(req.params.eventId);
        if(!event) res.status(401).json({ error: 'Aucun Evénement trouvé' });
        console.log("event :: ", event);
        return res.status(200).json({ event });
    } catch (error) {
        console.error('GET EVENT BY ID ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
  };

  const getOrganizerEvents = async (req, res) => {
    try {
        const organizerEvent = await getEventsByOrganizerId(req.params.organizerId);
        if(organizerEvent.length == 0) return res.status(401).json({ error: 'Aucun Evénement trouvé' });
        console.log('organizerEvent:', organizerEvent);
        return res.status(200).json({ events: organizerEvent });
    } catch (error) {
        console.error('GET EVENT BY OrganizerID ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  const updateEventBy_Id = async (req, res) => {
    try {
        const event = await getEventById(req.params.eventId);
        if(!event) return res.status(401).json({error: "Cet Evénement n'existe pas"});
        await updateEvent(req.params.eventId, req.body);
        const updatedEvent = await getEventById(req.params.eventId)
        return res.status(200).json({updatedEvent})
    } catch (error) {
        console.error('UPDATE EVENT BY ID ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
  };

  const updateEvent_Status = async (req, res) => {
    try {
        const {status} = req.body;
        const event = await getEventById(req.params.eventId);
        if(!event) return res.status(401).json({error: `Aucun Evénement trouvé avec l'id: ${req.params.eventId}`});
        await updateEventStatus(req.params.eventId, status);
        const updatedEvent = await getEventById(req.params.eventId);
        return res.status(200).json({updatedEvent});
    } catch (error) {
        console.error('UPDATE STATUS EVENT ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
  };

  const deleteEvent = async (req, res) => {
    try {
        const event = await getEventById(req.params.eventId);
        if(!event) return res.status(401).json({error: `Evénement non trouvé!`});
        await deleteEvents(req.params.eventId);
        return res.status(200).json({error: `Evénement ${req.params.eventId} supprimé avec succès!`})
    } catch (error) {
        console.error('DELETE EVENT ERROR:', error.message);
        res.status(500).json({ error: 'Erreur serveur' });
    }
  }

module.exports = {
    create_Event, 
    getEventBy_Id,
    getOrganizerEvents,
    updateEventBy_Id,
    updateEvent_Status,
    deleteEvent
}