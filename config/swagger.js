const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Book Review System API',
            version: '1.0.0',
            description: 'A RESTful API for managing books and reviews',
            contact: {
                name: 'API Support',
                url: 'https://github.com/shashank-16/BookReviewSystem_Billeasy',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Development server',
            },
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
    apis: [
        path.join(__dirname, '../routes/*.js'),
        path.join(__dirname, '../controllers/*.js'),
    ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
