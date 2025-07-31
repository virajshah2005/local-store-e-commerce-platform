const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../database/config');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const [cartItems] = await pool.execute(
      `SELECT ci.*, p.name, p.price, p.sale_price, p.image_url, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ? AND p.is_active = TRUE`,
      [req.user.id]
    );

    // Calculate totals
    let subtotal = 0;
    let totalItems = 0;

    cartItems.forEach(item => {
      const price = item.sale_price || item.price;
      subtotal += price * item.quantity;
      totalItems += item.quantity;
    });

    res.json({
      items: cartItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalItems
    });

  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add item to cart
router.post('/add', auth, [
  body('product_id').isInt().withMessage('Product ID must be a valid integer'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, quantity } = req.body;

    // Check if product exists and is active
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];

    // Check stock availability
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ 
        error: `Only ${product.stock_quantity} items available in stock` 
      });
    }

    // Check if item already exists in cart
    const [existingItems] = await pool.execute(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existingItems.length > 0) {
      // Update quantity
      const newQuantity = existingItems[0].quantity + quantity;
      
      if (product.stock_quantity < newQuantity) {
        return res.status(400).json({ 
          error: `Cannot add ${quantity} more items. Only ${product.stock_quantity - existingItems[0].quantity} available` 
        });
      }

      await pool.execute(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );

      res.json({ 
        message: 'Cart updated successfully',
        quantity: newQuantity
      });
    } else {
      // Add new item
      await pool.execute(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity]
      );

      res.status(201).json({ 
        message: 'Item added to cart successfully',
        quantity
      });
    }

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update cart item quantity
router.put('/update/:id', auth, [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity } = req.body;

    // Check if cart item exists and belongs to user
    const [cartItems] = await pool.execute(
      `SELECT ci.*, p.stock_quantity 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = ? AND ci.user_id = ?`,
      [id, req.user.id]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const cartItem = cartItems[0];

    // Check stock availability
    if (cartItem.stock_quantity < quantity) {
      return res.status(400).json({ 
        error: `Only ${cartItem.stock_quantity} items available in stock` 
      });
    }

    await pool.execute(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    res.json({ 
      message: 'Cart updated successfully',
      quantity
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove item from cart
router.delete('/remove/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart successfully' });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM cart_items WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ message: 'Cart cleared successfully' });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get cart count
router.get('/count', auth, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'SELECT SUM(quantity) as count FROM cart_items WHERE user_id = ?',
      [req.user.id]
    );

    const count = result[0].count || 0;
    res.json({ count });

  } catch (error) {
    console.error('Cart count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 