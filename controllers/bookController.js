const db = require('../config/db');

/**
 * @desc    Get all books with optional filtering and pagination
 * @route   GET /api/books
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with books and pagination info
 */
exports.getBooks = async (req, res) => {
    const { author, genre, page = 1, size = 10 } = req.query;
    const offset = (page - 1) * size;

    const filters = [];
    const values = [];

    if (author) {
        filters.push(`LOWER(author) LIKE LOWER($${values.length + 1})`);
        values.push(`%${author}%`);
    }
    if (genre) {
        filters.push(`genre = $${values.length + 1}`);
        values.push(genre);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const query = `SELECT * FROM books ${where} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(size, offset);

    const result = await db.query(query, values);

    const countQuery = 'SELECT COUNT(*) FROM books';
    const countResult = await db.query(countQuery);
    const totalReviews = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalReviews / size);

    // Construct the response
    const response = {
        data: result.rows,
        pagination: {
            current_page: page,
            total_pages: totalPages,
            total_reviews: totalReviews,
            limit: size
        }
    };
    res.json(response);
};

/**
 * @desc    Add a new book
 * @route   POST /api/books
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {Object} req.body - Book data
 * @param   {string} req.body.title - Book title
 * @param   {string} req.body.author - Book author
 * @param   {string} [req.body.genre] - Book genre (optional)
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with the created book
 */
exports.addBook = async (req, res) => {
    const { title, author, genre } = req.body;
    const result = await db.query(
        'INSERT INTO books (title, author, genre) VALUES ($1, $2, $3) RETURNING *',
        [title, author, genre]
    );
    res.json(result.rows[0]);
};

/**
 * @desc    Get a single book by ID with its reviews
 * @route   GET /api/books/:id
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {string} req.params.id - Book ID
 * @param   {number} [req.query.page=1] - Page number for reviews pagination
 * @param   {number} [req.query.limit=10] - Number of reviews per page
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with book details and paginated reviews
 */
exports.getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get book details
        const bookQuery = 'SELECT * FROM books WHERE id = $1';
        const bookResult = await db.query(bookQuery, [id]);

        if (bookResult.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Get average rating
        const avgRatingQuery = `
            SELECT COALESCE(ROUND(AVG(rating), 2), 0) as average_rating, 
                   COUNT(*) as total_reviews 
            FROM reviews 
            WHERE book_id = $1
        `;
        const avgRatingResult = await db.query(avgRatingQuery, [id]);

        // Get paginated reviews with user info
        const reviewsQuery = `
            SELECT r.*, u.username 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.book_id = $1
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const reviewsResult = await db.query(reviewsQuery, [id, limit, offset]);

        // Get total count of reviews for pagination
        const countQuery = 'SELECT COUNT(*) FROM reviews WHERE book_id = $1';
        const countResult = await db.query(countQuery, [id]);
        const totalReviews = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalReviews / limit);

        // Construct the response
        const response = {
            ...bookResult.rows[0],
            average_rating: parseFloat(avgRatingResult.rows[0].average_rating),
            total_reviews: parseInt(avgRatingResult.rows[0].total_reviews),
            reviews: {
                data: reviewsResult.rows,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_reviews: totalReviews,
                    limit: limit
                }
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching book details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @desc    Search for books by title or author
 * @route   GET /api/books/search
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {string} req.query.query - Search term
 * @param   {number} [req.query.page=1] - Page number
 * @param   {number} [req.query.limit=10] - Items per page
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with matching books and pagination info
 */
exports.searchBooks = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const searchTerm = `%${query}%`;
        const result = await db.query(
            'SELECT * FROM books WHERE title ILIKE $1 OR author ILIKE $2',
            [searchTerm, searchTerm]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'An error occurred while searching' });
    }
};

/**
 * @desc    Add a review for a book
 * @route   POST /api/books/:id/reviews
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {string} req.params.id - Book ID
 * @param   {Object} req.body - Review data
 * @param   {string} req.body.review_text - The review text
 * @param   {number} req.body.rating - Rating (1-5)
 * @param   {Object} req.user - Authenticated user (from auth middleware)
 * @param   {string} req.user.id - User ID
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with the created review
 */
exports.addReviewForBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { review_text, rating } = req.body;
        const result = await db.query(
            'INSERT INTO reviews (book_id, review_text, user_id, rating) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, review_text, req.user.id, rating]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'An error occurred while adding the review' });
    }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {string} req.params.id - Review ID
 * @param   {Object} req.body - Updated review data
 * @param   {string} [req.body.review_text] - Updated review text
 * @param   {number} [req.body.rating] - Updated rating (1-5)
 * @param   {Object} req.user - Authenticated user
 * @param   {string} req.user.id - User ID
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with the updated review
 */
exports.updateReviewForBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { review_text, rating } = req.body;
        const result = await db.query(
            'UPDATE reviews SET review_text = $2, rating = $3, updated_at = NOW() WHERE id = $1 AND user_id = $4 RETURNING *',
            [id, review_text, rating, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found or unauthorized' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'An error occurred while updating the review' });
    }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {string} req.params.id - Review ID
 * @param   {Object} req.user - Authenticated user
 * @param   {string} req.user.id - User ID
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with success message or error
 */
exports.deleteReviewForBook = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found or unauthorized' });
        }

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'An error occurred while deleting the review' });
    }
};
