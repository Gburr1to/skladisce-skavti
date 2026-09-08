const swaggerJsDoc = require('swagger-jsdoc');

const path = require('path');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Skavtsko Skladišče API',
      version: '1.0.0',
      description: 'API za upravljanje skavtskega skladišča, inventarja in uporabnikov', // POPRAVLJENO
    },
    servers: [
      { url: process.env.SERVER_URL || '/' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [path.join(__dirname, '../routes/*.js')],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;
