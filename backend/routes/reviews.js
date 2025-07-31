const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../database/config');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Add review
router.post('/', auth, [
  body('product_id').isInt().withMessage('Product ID must be a valid integer'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, rating, comment } = req.body;

    // Check if product exists
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user already reviewed this product
    const [existingReviews] = await pool.execute(
      'SELECT * FROM reviews WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existingReviews.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Add review
    await pool.execute(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, product_id, rating, comment]
    );

    res.status(201).json({ message: 'Review added successfully' });

  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get product reviews
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ?',
      [productId]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get reviews
    const [reviews] = await pool.execute(
      `SELECT r.*, u.name as user_name 
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, parseInt(limit), offset]
    );

    // Calculate average rating
    const [avgResult] = await pool.execute(
      'SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM reviews WHERE product_id = ?',
      [productId]
    );

    res.json({
      reviews,
      average_rating: parseFloat(avgResult[0].average_rating || 0).toFixed(1),
      total_reviews: avgResult[0].total_reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's reviews
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.*, p.name as product_name, p.image_url
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({ reviews });
  } catch (error) {
    console.error('User reviews fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update review
router.put('/:id', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    // Check if review exists and belongs to user
    const [reviews] = await pool.execute(
      'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update review
    await pool.execute(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [rating, comment, id]
    );

    res.json({ message: 'Review updated successfully' });

  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM reviews WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });

  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 