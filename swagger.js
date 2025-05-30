const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const fs = require("fs");

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
    },
    servers: [
      {
        url: "/",
        description: "Current server",
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
      schemas: {
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              description: "JWT refresh token",
            },
          },
        },
        TokenResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            accessToken: {
              type: "string",
              description: "JWT access token",
            },
            refreshToken: {
              type: "string",
              description: "JWT refresh token",
            },
            user: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "User ID",
                },
                name: {
                  type: "string",
                  description: "User's name",
                },
                email: {
                  type: "string",
                  description: "User's email",
                },
                role: {
                  type: "string",
                  description: "User's role",
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Parse route files one by one to catch any problematic files
  apis: [
    "./src/routes/auth.routes.js",
    "./src/routes/clerk.routes.js",
    "./src/routes/partner.routes.js",
    "./src/routes/reward.routes.js",
    "./src/routes/qr.routes.js",
    "./src/routes/claim.routes.js",
    // Only include models if they have Swagger comments
    // "./src/models/*.js"
  ],
};

// Wrap swagger spec generation in try-catch to identify problematic files
let swaggerSpec;
try {
  swaggerSpec = swaggerJsdoc(swaggerOptions);
  console.log("✅ Swagger spec generated successfully");
} catch (error) {
  console.error("❌ Error generating Swagger spec:", error);

  // Try to identify which file is causing the issue
  const files = [
    "./src/routes/auth.routes.js",
    "./src/routes/clerk.routes.js",
    "./src/routes/partner.routes.js",
    "./src/routes/reward.routes.js",
    "./src/routes/qr.routes.js",
    "./src/routes/claim.routes.js",
  ];

  console.log("🔍 Testing individual files...");
  for (const file of files) {
    try {
      const testSpec = swaggerJsdoc({
        definition: swaggerOptions.definition,
        apis: [file],
      });
      console.log(`✅ ${file} - OK`);
    } catch (fileError) {
      console.log(`❌ ${file} - ERROR:`, fileError.message);
    }
  }

  // Create a minimal spec as fallback
  swaggerSpec = {
    openapi: "3.0.0",
    info: swaggerOptions.definition.info,
    servers: swaggerOptions.definition.servers,
    paths: {},
    components: swaggerOptions.definition.components,
  };
}

// Create a custom Swagger UI HTML with CDN resources and improved request handling
const generateHTML = (options) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${options.title || "Swagger UI"}</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.3.1/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.3.1/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.3.1/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const requestInterceptor = (request) => {
        if (request.url.includes('/refresh-token') && request.body) {
          try {
            if (typeof request.body === 'string') {
              const parsedBody = JSON.parse(request.body);
              request.body = JSON.stringify(parsedBody);
            }
          } catch (e) {
            console.error('Error formatting request body:', e);
          }
        }
        return request;
      };
      
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(options.spec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        requestInterceptor: requestInterceptor,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        validatorUrl: null,
        displayRequestDuration: true
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
  `;
};

const swaggerDocs = (app) => {
  // Handle Swagger UI route
  app.get("/api/docs", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    const html = generateHTML({
      title: "Eco Rewards API Documentation",
      spec: swaggerSpec,
    });
    res.send(html);
  });

  // Make swagger.json available
  app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  app.get("/test-refresh-token", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Refresh Token</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .form-group { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; }
          input[type="text"] { width: 100%; padding: 8px; }
          button { padding: 10px 15px; background: #4CAF50; border: none; color: white; cursor: pointer; }
          #result { margin-top: 20px; padding: 10px; border: 1px solid #ddd; min-height: 100px; }
        </style>
      </head>
      <body>
        <h1>Test Refresh Token</h1>
        <div class="form-group">
          <label for="refresh-token">Refresh Token:</label>
          <input type="text" id="refresh-token" placeholder="Enter your refresh token">
        </div>
        <button id="submit">Submit</button>
        <div id="result">
          <p>Results will appear here...</p>
        </div>
        
        <script>
          document.getElementById('submit').addEventListener('click', async () => {
            const refreshToken = document.getElementById('refresh-token').value;
            const resultDiv = document.getElementById('result');
            
            try {
              const response = await fetch('/api/v1/auth/refresh-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
              });
              
              const data = await response.json();
              resultDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
              resultDiv.innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
            }
          });
        </script>
      </body>
      </html>
    `);
  });
};

module.exports = { swaggerDocs };
