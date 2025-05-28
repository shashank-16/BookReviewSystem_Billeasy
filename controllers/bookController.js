const db = require('../config/db');

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

exports.addBook = async (req, res) => {
    const { title, author, genre } = req.body;
    const result = await db.query(
        'INSERT INTO books (title, author, genre) VALUES ($1, $2, $3) RETURNING *',
        [title, author, genre]
    );
    res.json(result.rows[0]);
};

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

exports.addReviewForBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { review_text, rating } = req.body;
        const result = await db.query('INSERT INTO reviews (book_id, review_text, user_id, rating) VALUES ($1, $2, $3, $4) RETURNING *', [id, review_text, req.user.id, rating]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'An error occurred while adding the review' });
    }
};

exports.updateReviewForBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { review_text, rating } = req.body;
        const result = await db.query('UPDATE reviews SET review_text = $2, rating = $3 WHERE id = $1 RETURNING *', [id, review_text, rating]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'An error occurred while updating the review' });
    }
};

exports.deleteReviewForBook = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'An error occurred while deleting the review' });
    }
};
