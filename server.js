require('dotenv').config({ path: './config/.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const port = process.env.PORT || 3000;

// Import routes
const authRoute = require('./routes/authRoute');
const bookRoute = require('./routes/bookRoute');

// CORS configuration
const corsOption = {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
};

// Middleware
app.use(cors(corsOption));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Book Review System API',
}));

// API Routes
app.use('/api', authRoute);
app.use('/api/books', bookRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;