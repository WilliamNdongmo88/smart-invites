require("dotenv").config({path: ".env.test"});
const {getUserById} = require('../models/users');
const {createEvent, getEventById,updateEvent,updateEventStatus,
    getEventsByOrganizerId, getEventWithTotalGuest, deleteEvents, 
    getEventWithTotalGuestById, getEventAndInvitationById,
    getUserByEventId} = require('../models/events');
const {getGuestByEventIdAndConfirmedRsvp} = require('../models/guests');
const {getGuestsCheckIns} = require('../models/checkins');
const { generatePresentGuestsPdf, generateDualGuestListPdf } = require('../services/pdfService');

const schedule = require('node-schedule');
const { getGuestByInvitationId } = require('../models/invitations');
const { sendPdfByEmail } = require('../services/notification.service');
const { sendScheduledThankMessage } = require('./checkin.controller');
const { getEventScheduleByEventId, createEventSchedule, updateEventSchedule, deleteEventSchedule } = require('../models/event_schedules');


const create_Event = async (req, res, next) => {
    try {
        if (req.body.length==0) return res.status(404).json({error: "Liste vide"});
        let eventDatas = req.body;
        console.log('eventDatas :: ', eventDatas);
        const existing = await getUserById(eventDatas[0].organizerId);
        if (!existing) return res.status(409).json({ error: "Organizer not found with ID: " + organizerId });
        let returnDatas = [];
        for (const event of eventDatas) {
            const {
                organizerId, title, description, eventDate, banquetTime, religiousLocation, 
                religiousTime, type, budget, eventNameConcerned1, eventNameConcerned2, 
                eventCivilLocation, eventLocation, maxGuests,hasPlusOne, footRestriction, 
                showWeddingReligiousLocation, status} = event;
            const eventId = await createEvent(organizerId, title, description, eventDate, banquetTime, 
                                              religiousLocation, religiousTime, type, budget, 
                                              eventNameConcerned1,eventNameConcerned2, 
                                              eventCivilLocation, eventLocation, maxGuests,hasPlusOne, 
                                              footRestriction, showWeddingReligiousLocation, status);
            returnDatas.push({id: eventId, organizerId, title, description, eventDate, banquetTime, 
                religiousLocation, religiousTime, type, budget, eventNameConcerned1,eventNameConcerned2, 
                eventCivilLocation, eventLocation, maxGuests,hasPlusOne, footRestriction, 
                showWeddingReligiousLocation, status})
            // Planification (Sensé s'exécuter le lendemain du jour de l'événement)
            try {
                console.log('[create_Event] eventId :', eventId);
                const existingSchedule = await getEventScheduleByEventId(eventId);
                //console.log('[create_Event] existingSchedule:', existingSchedule);
                // Une tâche existe déjà → NE PAS EN RECRÉER
                if (existingSchedule) {
                    console.log(`Schedule déjà existant pour event ${eventId}`);
                    return;
                }
                const scheduleId = await createEventSchedule(eventId, eventDate, false);
                //console.log(`Schedule créé pour event ${eventId} → Exécution : ${eventDate}`);
                planSchedule(scheduleId, eventId, eventDate);
            } catch (error) {
                console.error("Erreur planification scheduler:", error);
                next(error);
            }
        }
        return res.status(201).json(returnDatas);
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
        console.log('### event:', event);
        if(!event) res.status(404).json({ error: 'Aucun Evénement trouvé' });
        return res.status(200).json(event);
    } catch (error) {
        console.error('GET EVENT BY ID ERROR:', error.message);
        next(error);
    }
  };

  const getEventAndInvitationRelatedById = async (req, res, next) => {
    try {
        const event = await getEventAndInvitationById(req.params.eventId);
        if(!event) res.status(404).json({ error: 'Aucun Evénement trouvé' });
        return res.status(200).json(event);
    } catch (error) {
        console.error('GET EVENT-INVITATION BY ID ERROR:', error.message);
        next(error);
    }
  }

  const getOrganizerEvents = async (req, res, next) => {
    try {
        const organizerEvent = await getEventsByOrganizerId(req.params.organizerId);
        if(organizerEvent.length == 0) return res.status(404).json({ error: 'Aucun Evénement trouvé' });
        //console.log('organizerEvent:', organizerEvent);
        return res.status(200).json({ events: organizerEvent });
    } catch (error) {
        console.error('GET EVENT BY OrganizerID ERROR:', error.message);
        next(error);
    }
  }

  const updateEventBy_Id = async (req, res, next) => {
    try {
        let { organizerId, title, description, eventDate, banquetTime, religiousLocation, religiousTime, 
            eventCivilLocation, eventLocation, maxGuests, hasPlusOne, footRestriction, 
            showWeddingReligiousLocation, status, type, budget, eventNameConcerned1, eventNameConcerned2
        } = req.body;

        const event = await getEventById(req.params.eventId);
        if(!event) return res.status(404).json({error: "Cet Evénement n'existe pas"});

        if(organizerId == null){ organizerId = event.organizer_id};
        if(title == null){ title = event.title};
        if(description == null){ description = event.description};
        if(eventDate == null){ eventDate = event.event_date};
        if(banquetTime == null){ banquetTime = event.banquet_time};
        if(religiousLocation == null){ religiousLocation = event.religious_location};
        if(religiousTime == null){ religiousTime = event.religious_time};
        if(eventCivilLocation == null){ eventCivilLocation = event.civil_location};
        if(eventLocation == null){ eventLocation = event.event_location};
        if(maxGuests == null){ maxGuests = event.max_guests};
        if(hasPlusOne == null){ hasPlusOne = event.has_plus_one};
        if(type == null){ type = event.type};
        if(budget == null){ budget = event.budget};
        if(eventNameConcerned1 == null){ eventNameConcerned1 = event.event_name_concerned1};
        if(eventNameConcerned2 == null){ eventNameConcerned2 = event.event_name_concerned2};
        if(footRestriction == null){ footRestriction = event.foot_restriction};
        if(showWeddingReligiousLocation == null){ showWeddingReligiousLocation = event.show_wedding_religious_location};
        if(status == null){ status = event.status};

        const organizer = await getUserById(organizerId);
        if(!organizer) return res.status(404).json({error: "Organizer non trouvé!"})
        await updateEvent(req.params.eventId, organizerId, title, description, eventDate, banquetTime,
            religiousLocation, religiousTime, eventCivilLocation, eventLocation, maxGuests, hasPlusOne, 
            footRestriction, showWeddingReligiousLocation, status, type, 
            budget, eventNameConcerned1, eventNameConcerned2 );
        const updatedEvent = await getEventById(req.params.eventId);
        
        const existingSchedule = await getEventScheduleByEventId(req.params.eventId);
        console.log('### existing schedule:', existingSchedule);
        const scheduleId = await updateEventSchedule(existingSchedule.id, req.params.eventId, eventDate, false, false);
        
        console.log('### scheduleId:', scheduleId);
        console.log(`Schedule mis à jour pour event ${req.params.eventId} → Exécution : ${eventDate}`);
        //planSchedule(scheduleId, req.params.eventId, eventDate);
        console.log("updateEventBy_Id env.NODE_ENV: ", process.env.NODE_ENV);
        if (process.env.NODE_ENV !== 'test') {
            planSchedule(scheduleId, req.params.eventId, eventDate);
        }
        
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
        const guests = await getEventWithTotalGuestById(req.params.eventId);
        //console.log("guests: ", guests[0].total_guests);
        if(guests[0].total_guests > 0) return res.status(409).json({error: `Impossible de supprimer cet événement car des invités y sont associés.`});
        await deleteEventSchedule(req.params.eventId);
        await deleteEvents(req.params.eventId);
        return res.status(200).json({message: `Evénement ${req.params.eventId} supprimé avec succès!`})
    } catch (error) {
        console.error('DELETE EVENT ERROR:', error.message);
        next(error);
    }
  }

  const generatePresentGuests = async (req, res, next) => {
    try {
        const guestsList = req.body.filteredGuests;
        const event = req.body.event;
        // console.log('guestsList:', guestsList);
        // console.log('event:', event);
        if (!Array.isArray(guestsList) || guestsList.length === 0) {
            return res.status(400).json({ error: 'Le tableau d\'invités est requis' });
        }
        const pdfBuffer = await generatePresentGuestsPdf(guestsList, event);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=invites-present.pdf");
        res.send(pdfBuffer);
    } catch (error) {
        console.log('[generatePresentGuests] error:', error.message);
        next(error);
    }
  }

  async function sendSReportManually(res, next) {
    try {
        await sendScheduledReport();
        return res.status(200).json({succes: true})
    } catch (error) {
        next(error)
    }
  }

  async function sendSThankMessageManually(req, res, next) {
      try {
          await sendScheduledThankMessage(req.body.event, req.body.organizer, req.body.guest);
          return res.status(200).json({succes: true})
      } catch (error) {
          next(error)
      }
  }

  // Créer la date cible: 6 décembre 2025 à 11:33
  //const date = new Date(2025, 10, 23, 19, 21, 0);"2025-11-22T20:56:00.000Z"
  // Attention : le mois commence à 0 => 11 = décembre

  // Planifier la tâche
  async function planSchedule(scheduleId, eventId, eventDate) {
    try {
        console.log('[schedule 1] eventDate :', eventDate);
        if(eventDate==null || eventDate==undefined) throw new Error("La date est invalide");
        // Conversion finale selon ta logique métier
        const scheduleDate = formatDate(eventDate);
        console.log('[schedule 1] scheduleDate (réelle pour scheduler):', scheduleDate);
        // Planification
        schedule.scheduleJob(scheduleDate, async () => {
            console.log('🚀 === Job déclenché ===');
            await runScheduledTask(scheduleId, eventId, eventDate);
        });

    } catch (error) {
        console.error("❌ Erreur planSchedule:", error);
    }
  }

  async function runScheduledTask(scheduleId, eventId, scheduledFor) {
    console.log(`Exécution du scheduler pour l'événement ${eventId}`);

    // Marquer comme exécuté
    await updateEventSchedule(scheduleId, eventId, scheduledFor, true, false);

    await sendScheduledReport(eventId);

    console.log(`Scheduler terminé pour l'événement ${eventId}`);
  }

  async function sendScheduledReport(eventId) {
        console.log('=== Job déclenché =1=');
    try {
        let guestPresentList = [];
        let guestConfirmedList = [];
        let data = {};
        const checkins = await getGuestsCheckIns();
        //console.log("checkins:: ", checkins);
        for (const event of checkins) {
            if(eventId==event.event_id){
                data = await getUserByEventId(event.event_id);
                break
            }
        }
        console.log('Event data:', data);
        for (const data of checkins) {
            if(data.event_id==eventId){
                const timer1 = data.checkin_time.toISOString().split('T')[1]
                const guest = await getGuestByInvitationId(data.invitation_id);
                const timer2 = guest.usedAt.toISOString().split('T')[1]
                const obj = {
                    name: guest.name,
                    plusOneName: guest.plusOneName,
                    rsvpStatus: guest.rsvpStatus,
                    dateTime: timer1.split(':')[0]+':'+timer1.split(':')[1].split(':')[0],
                    usedAt: timer2.split(':')[0]+':'+timer2.split(':')[1].split(':')[0],
                }
                guestPresentList.push(obj);
            }
        }
        //console.log("guestPresentList:: ", guestPresentList);
        const results = await getGuestByEventIdAndConfirmedRsvp(data.eventId);
        for (const elt of results) {
            const data = {
                name: elt.name,
                plusOneName: elt.plusOneName,
                rsvpStatus: elt.rsvpStatus,
                updatedAt: elt.updatedAt.toISOString().split('T')[0],
            }
            guestConfirmedList.push(data);
        }
        console.log("guestConfirmedList:: ", guestConfirmedList);
        const pdfBuffer = await generateDualGuestListPdf(guestPresentList, guestConfirmedList, data);
        //console.log("pdfBuffer:: ", pdfBuffer);
        await sendPdfByEmail(data, pdfBuffer);
    } catch (error) {
        console.log('[sendScheduledReport] error:', error);
    }
  }

function formatDate(iso) {
    let d = new Date(iso);

    // Ajouter 1 jour en UTC
    d.setDate(d.getDate() + 1);

    // Créer une date UTC propre (pas locale)
    const utcDate = new Date(Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds()
    ));

    return utcDate;
}

module.exports = {
    create_Event,
    getAllEvents, 
    getEventBy_Id,
    getEventAndInvitationRelatedById,
    getOrganizerEvents,
    updateEventBy_Id,
    updateEvent_Status,
    deleteEvent,
    generatePresentGuests,
    sendSReportManually,
    sendSThankMessageManually,
    formatDate,
    sendScheduledReport
}