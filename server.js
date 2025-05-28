require('dotenv').config({ path: './config/.env' });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const app = new express();
const port = process.env.PORT || 3000;

const authRoute = require('./routes/authRoute');
const bookRoute = require('./routes/bookRoute');

const corsOption = {
    origin: '*',
    optionSuccessStatus: 200,
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors(corsOption));

// API Routes
app.use('/api', authRoute);
app.use('/api/books', bookRoute);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Book Review System API',
}));

app.get('/api/', (req, res) => {
    res.status(200).send("This API endpoint is for Book Review System");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});