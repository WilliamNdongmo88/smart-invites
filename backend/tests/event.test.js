process.env.NODE_ENV = "test";
require("dotenv").config({path: ".env.test"});

const schedule = require('node-schedule');
const request = require("supertest");
const { app, startServer, closeServer } = require("../app");

let server;
let token;
let organizerId;
let eventId;

describe("Events API", () => {
    beforeAll(async () => {
        server = await startServer();
    });

    describe("Test", () => {
        const userData = {email: "will@example.com", password: "Willfr123", role: "admin"};
        
        test("REGISTER USER", async () => {
            const res = await request(app).post('/api/auth/register').send(userData);

            expect(res.statusCode).toBe(201);
        });

        test("LOGIN USER", async () => {
            const res = await request(app).post("/api/auth/login").send(userData);
            console.log("LOGIN RESPONSE:", res.body);
            token = res.body.accessToken;
            organizerId = res.body.user.id;

            expect(res.statusCode).toBe(200);
        });

        test("CREATE EVENT", async () => {
            const eventDatas = [{
                organizerId,
                title: "Mariage de William et Gloria",
                description: "Nous avons le plaisir de vous inviter à célébrer notre mariage. Ce sera une journée inoubliable remplie de joie, d'amour et de moments précieux en compagnie de nos proches.",
                eventDate: "2026-06-06",
                eventLocation: "Djamena",
                maxGuests: 150,
                hasPlusOne: false,
                footRestriction: false,
                status: "planned",
                type: "wedding",
                budget: 3000,
                eventNameConcerned1: "William",
                eventNameConcerned2: "Gloria"
            }];
            
            const res = await request(app)
            .post("/api/event/create-event")
            .send(eventDatas)
            .set("Authorization", `Bearer ${token}`);

            console.log("CREATE EVENT RESPONSE:", res.body);
            eventId = res.body[0].id;
            expect(res.statusCode).toBe(201);
            expect(res.body[0]).toHaveProperty("organizerId");
            expect(res.body[0].organizerId).toBe(2);
        });

        test("GET ALL EVENT", async () => {
            const res = await request(app)
            .get("/api/event/all-events")
            .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("result");
            expect(res.body.result.length).toBe(1);
        });

        test("GET ONE EVENT", async () => {
            const res = await request(app)
            .get(`/api/event/${eventId}`)
            .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(1);
        });

        test("GET All ORGANIZER EVENT", async () => {
            const res = await request(app)
            .get(`/api/event/organizer/${organizerId}`)
            .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("events");
            expect(res.body.events.length).toBe(1);
        });

        test("UPDATE EVENT", async () => {
            const updateData = {
                organizerId,
                eventLocation: "Palais des fêtes de Djamena",
                maxGuests: 151,
                hasPlusOne: true,
                footRestriction: true,
            };
            const res = await request(app)
            .put(`/api/event/${eventId}`)
            .set("Authorization", `Bearer ${token}`)
            .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("updatedEvent");
            expect(res.body.updatedEvent.max_guests).toBe(151);
        });

        test("UPDATE STATUS EVENT", async () => {
            const updateData = {
                status: "ACTIVE"
            };
            const res = await request(app)
            .put(`/api/event/status/${eventId}`)
            .set("Authorization", `Bearer ${token}`)
            .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("updatedEvent");
            expect(res.body.updatedEvent.status).toBe("ACTIVE");
        });

        test("DELETE EVENT", async () => {
            const res = await request(app)
            .delete(`/api/event/${eventId}`)
            .set("Authorization", `Bearer ${token}`);
            
            console.log("EVENT RESPONSE:", res.body);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("message");
            expect(res.body.message).toBe(`Evénement ${eventId} supprimé avec succès!`);
        });
    });

    afterAll(async () => {
        await closeServer();
        // Annule tous les jobs en cours pour libérer l'event loop
        const jobs = schedule.scheduledJobs;
        for (let jobName in jobs) {
            jobs[jobName].cancel();
        }
    });
});