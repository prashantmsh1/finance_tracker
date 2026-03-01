import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Expense Tracker API",
            version: "1.0.0",
            description:
                "A comprehensive API for managing personal finances, tracking expenses and income, categorizing transactions, and generating analytics dashboards.",
            contact: {
                name: "API Support",
            },
        },
        servers: [
            {
                url: "http://localhost:8000",
                description: "Local Development Server",
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token",
                    description: "JWT Token stored in HTTP-Only cookie",
                },
            },
        },
        security: [
            {
                cookieAuth: [],
            },
        ],
    },
    apis: ["./src/routes/*.ts", "./src/controller/*.ts"], // Automatically extract from route and controller files
};

export const swaggerSpec = swaggerJsdoc(options);
