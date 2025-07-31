const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { pool } = require('../database/config');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return !isNaN(value) && parseInt(value) > 0;
  }).withMessage('Category must be a valid ID'),
  query('search').optional().trim(),
  query('minPrice').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return !isNaN(value) && parseFloat(value) >= 0;
  }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return !isNaN(value) && parseFloat(value) >= 0;
  }).withMessage('Max price must be a positive number'),
  query('sort').optional().isIn(['name', 'price', 'created_at']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    let whereConditions = ['p.is_active = TRUE'];
    let queryParams = [];

    if (category) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category);
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (minPrice) {
      whereConditions.push('p.price >= ?');
      queryParams.push(minPrice);
    }

    if (maxPrice) {
      whereConditions.push('p.price <= ?');
      queryParams.push(maxPrice);
    }

    const offset = (page - 1) * limit;
    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get products with average ratings
    const [products] = await pool.execute(
      `SELECT p.*, c.name as category_name,
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as review_count
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       LEFT JOIN reviews r ON p.id = r.product_id
       WHERE ${whereClause}
       GROUP BY p.id
       ORDER BY p.${sort} ${order.toUpperCase()}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get featured products
router.get('/featured', async (req, res) => {
  try {
    const [products] = await pool.execute(
      `SELECT p.*, c.name as category_name,
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as review_count
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       LEFT JOIN reviews r ON p.id = r.product_id
       WHERE p.is_active = TRUE
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT 8`
    );

    res.json({ products });
  } catch (error) {
    console.error('Featured products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get product reviews
    const [reviews] = await pool.execute(
      `SELECT r.*, u.name as user_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ? 
       ORDER BY r.created_at DESC`,
      [id]
    );

    // Get average rating
    const [ratingResult] = await pool.execute(
      `SELECT AVG(rating) as average_rating, COUNT(*) as review_count
       FROM reviews 
       WHERE product_id = ?`,
      [id]
    );

    const product = products[0];
    product.reviews = reviews;
    product.average_rating = ratingResult[0]?.average_rating || 0;
    product.review_count = ratingResult[0]?.review_count || 0;

    res.json({ product });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product (admin only)
router.post('/', adminAuth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category_id').optional().isInt().withMessage('Category must be a valid ID'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      price,
      sale_price,
      category_id,
      stock_quantity = 0,
      image_url
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO products (name, description, price, sale_price, category_id, stock_quantity, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, sale_price, category_id, stock_quantity, image_url]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: result.insertId,
        name,
        description,
        price,
        sale_price,
        category_id,
        stock_quantity,
        image_url
      }
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product (admin only)
router.put('/:id', adminAuth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateFields = [];
    const updateValues = [];

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(req.body[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get categories
router.get('/categories/all', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories ORDER BY name'
    );

    res.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 