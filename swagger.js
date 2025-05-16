const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Eco Rewards API Documentation",
      version: "1.0.0",
      description: "API documentation for the Eco Rewards application",
      contact: {
        name: "Juadeb Gabriel",
        email: "juadebgabriel@gmail.com",
      },
      license: {
        name: "License Name",
        url: "https://license-url.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://ecorewards-web-app.vercel.app",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Path to the API docs. Use glob patterns to match multiple files
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const swaggerDocs = (app, port) => {
  // Swagger page
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(`Docs available at http://localhost:${port}/api/docs`);
};

module.exports = { swaggerDocs };
