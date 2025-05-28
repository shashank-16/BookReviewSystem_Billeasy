const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authMiddleware');
const bookController = require('../controllers/bookController');

router.get('/search', bookController.searchBooks);
router.get('/', bookController.getBooks);
router.post('/', authenticate, bookController.addBook);
router.get('/:id', bookController.getBookById);
router.post('/:id/reviews', authenticate, bookController.addReviewForBook);
router.put('/reviews/:id', authenticate, bookController.updateReviewForBook);
router.delete('/reviews/:id', authenticate, bookController.deleteReviewForBook);

module.exports = router;