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
        url:
          process.env.NODE_ENV === "production"
            ? "https://ecorewards-web-app.vercel.app"
            : `http://localhost:${process.env.PORT || 5000}`,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
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
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const swaggerDocs = (app, port) => {
  // Configure swagger options for serverless environment
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      url: "/api/docs.json",
    },
  };

  // Swagger page
  app.use("/api/docs", swaggerUi.serve);
  app.get("/api/docs", swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Docs in JSON format
  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(
    `Docs available at ${
      process.env.NODE_ENV === "production"
        ? "https://ecorewards-web-app.vercel.app"
        : `http://localhost:${port}`
    }/api/docs`
  );
};

module.exports = { swaggerDocs };
