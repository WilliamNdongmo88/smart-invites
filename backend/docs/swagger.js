const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require('dotenv').config();

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Smart Invite",
            version: "1.0.0",
            description: "Documentation de l'API Smart Invite (Auth + Events + Guests + Invitations)",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas:{
                AuthRegister: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            example: "user@example.com",
                        },
                        password: {
                            type: "string",
                            minLength: 6,
                            example: "mypassword123"
                        }
                    }
                },
                AuthLogin: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            example: "user@example.com",
                        },
                        password: {
                            type: "string",
                            example: "mypassword123",
                        },
                    },
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        accessToken: {
                            type: "string",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        },
                    },
                },
                MeResponse: {
                type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            example: 1,
                        },
                        name: {
                            type: "string",
                            example: "will",
                        },
                        email: {
                            type: "string",
                            example: "will@example.com",
                        },
                    },
                },
            }
        }
    },
    apis: ["./backend/routes/*.js"],
};

const swaggerDocument = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log("#: Swagger docs: http://localhost:"+process.env.PORT+"/api-docs");
}

module.exports = setupSwagger;