process.env.NODE_ENV = "test";
require("dotenv").config({path: ".env.test"});

const request = require("supertest");
const { app, startServer, closeServer } = require("../app");

let server;
let token;
let refreshToken;
let email;

describe("Auth API", () => {
    beforeAll(async () => {
        server = await startServer();
    });

    describe("Test", () => {
        const userData = {email: "will@example.com", password: "password123"};

        test("REGISTER USER", async () => {
            const res = await request(app).post('/api/auth/register').send(userData);

            expect(res.statusCode).toBe(201);
        });

        test("LOGIN USER", async () => {
            const res = await request(app).post("/api/auth/login").send(userData);
            // console.log("LOGIN RESPONSE:", res.body);
            token = res.body.accessToken;
            refreshToken = res.body.refreshToken;
            email = res.body.user.email;
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("accessToken");
            expect(res.body).toHaveProperty("refreshToken");
        });

        test("REFRESH TOKEN USER", async () => {
            const res = await request(app)
            .post("/api/auth/refresh-token").send({refreshToken: refreshToken});

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("accessToken");
            expect(res.body).toHaveProperty("refreshToken");
        });

        test("FORGOT PASSWORD USER", async () => {
            const res = await request(app)
            .post("/api/auth/forgot-password").send({email: email});

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("message");
        });

        // test("CHECK CODE USER", async () => {
        //     const res = await request(app)
        //     .post("/api/auth/check-code").send({email: email, code: "461311"});

        //     expect(res.statusCode).toBe(500);
        //     expect(res.body).toHaveProperty("status");
        //     expect(res.body).toHaveProperty("message");
        // });

        test("RESET PASSWORD USER", async () => {
            const res = await request(app)
            .post("/api/auth/reset-password").send({email: email, newpassword: "newpassword123"});

            console.log("res:: ", res.body)
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("userId");
            expect(res.body).toHaveProperty("message");
        });
    })

    afterAll(async () => {
        await closeServer();
    });
})