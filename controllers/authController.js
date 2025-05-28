const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

/**
 * @desc    Register a new user
 * @route   POST /api/signup
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} req.body - User registration data
 * @param   {string} req.body.username - Username (3-30 characters)
 * @param   {string} req.body.email - User's email address
 * @param   {string} req.body.password - User's password (min 6 characters)
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with user data (excluding password)
 * @throws  {Error} 400 - If user already exists or invalid data provided
 */
exports.signup = async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: 'User already exists or invalid data.' });
    }
};

/**
 * @desc    Authenticate user and get JWT token
 * @route   POST /api/login
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} req.body - User credentials
 * @param   {string} req.body.email - User's email address
 * @param   {string} req.body.password - User's password
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with JWT token
 * @throws  {Error} 400 - If email is not found
 * @throws  {Error} 401 - If password is incorrect
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });

    res.json({ token });
};
