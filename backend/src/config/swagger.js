const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ShopSphere API',
            version: '1.0.0',
            description: 'E-commerce REST API — Auth, Users, Products, Categories'
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Local development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./src/routes/*.js']  // Swagger will read comments from all files in "routes" folder
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;