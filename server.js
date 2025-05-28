require('dotenv').config({ path: './config/.env' });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
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

app.get('/api/', (req, res) => {
    res.status(200).send("This API endpoint is for Book Review System");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});