const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../database/config');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Create order
router.post('/', auth, [
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('customerPhone').notEmpty().withMessage('Customer phone is required'),
  body('customerEmail').isEmail().withMessage('Valid email is required'),
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('billingAddress').notEmpty().withMessage('Billing address is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Valid subtotal is required'),
  body('total_amount').isFloat({ min: 0 }).withMessage('Valid total amount is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
      subtotal,
      cgst_amount,
      sgst_amount,
      delivery_charges,
      discount_amount,
      total_amount,
      items
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Validate stock
      for (const item of items) {
        const [product] = await connection.execute(
          'SELECT price, sale_price, stock_quantity FROM products WHERE id = ?',
          [item.product_id || item.id]
        );
        
        if (product.length === 0) {
          throw new Error(`Product with ID ${item.product_id || item.id} not found`);
        }

        // Check stock
        if (product[0].stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ID ${item.product_id || item.id}`);
        }
      }

      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          user_id, order_number, status, subtotal, cgst_amount, sgst_amount, 
          delivery_charges, discount_amount, total_amount, payment_method, 
          shipping_address, billing_address, customer_name, customer_phone, 
          customer_email, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id, orderNumber, 'pending', subtotal, cgst_amount, sgst_amount,
          delivery_charges, discount_amount, total_amount, paymentMethod,
          shippingAddress, billingAddress, customerName, customerPhone,
          customerEmail, notes
        ]
      );

      const orderId = orderResult.insertId;

      // Add order items and update stock
      for (const item of items) {
        const [product] = await connection.execute(
          'SELECT price, sale_price FROM products WHERE id = ?',
          [item.product_id || item.id]
        );
        
        const price = product[0].sale_price || product[0].price;

        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id || item.id, item.quantity, price]
        );

        // Update stock
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id || item.id]
        );
      }

      // Clear cart
      await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

      await connection.commit();

      // Get the complete order
      const [orders] = await connection.execute(
        `SELECT o.*, 
                JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'name', p.name,
                    'image_url', p.image_url
                  )
                ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.id = ?
         GROUP BY o.id`,
        [orderId]
      );

      res.status(201).json({
        message: 'Order created successfully',
        order: orders[0]
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, 
              COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, 
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', oi.id,
                  'product_id', oi.product_id,
                  'quantity', oi.quantity,
                  'price', oi.price,
                  'name', p.name,
                  'image_url', p.image_url
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = ? AND o.user_id = ?
       GROUP BY o.id`,
      [req.params.id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: orders[0] });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Admin: Get all orders
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    let queryParams = [];

    if (status) {
      whereClause += ' AND o.status = ?';
      queryParams.push(status);
    }

    const [orders] = await pool.execute(
      `SELECT o.*, 
              u.name as customer_name,
              COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE ${whereClause}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}`,
      queryParams
    );

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin: Update order status
router.patch('/:id/status', adminAuth, [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;

    const [result] = await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if order belongs to user and can be cancelled
      const [orders] = await connection.execute(
        'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status IN ("pending", "processing")',
        [req.params.id, req.user.id]
      );

      if (orders.length === 0) {
        return res.status(404).json({ error: 'Order not found or cannot be cancelled' });
      }

      // Update order status
      await connection.execute(
        'UPDATE orders SET status = "cancelled" WHERE id = ?',
        [req.params.id]
      );

      // Restore product stock
      const [orderItems] = await connection.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [req.params.id]
      );

      for (const item of orderItems) {
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      await connection.commit();
      res.json({ message: 'Order cancelled successfully' });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router; 