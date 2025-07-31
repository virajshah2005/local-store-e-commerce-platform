const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../database/config');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (role) {
      whereClause = 'WHERE role = ?';
      queryParams.push(role);
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get users
    const [users] = await pool.execute(
      `SELECT id, name, email, role, phone, address, created_at 
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user statistics (admin only)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // Total users
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    // Total customers
    const [totalCustomers] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    
    // Total orders
    const [totalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    
    // Total revenue
    const [totalRevenue] = await pool.execute(
      "SELECT SUM(total_amount) as total FROM orders WHERE status != 'cancelled'"
    );

    res.json({
      total_users: totalUsers[0].count,
      total_customers: totalCustomers[0].count,
      total_orders: totalOrders[0].count,
      total_revenue: parseFloat(totalRevenue[0].total || 0).toFixed(2)
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role (admin only)
router.put('/:id/role', adminAuth, [
  body('role').isIn(['customer', 'admin']).withMessage('Role must be customer or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { role } = req.body;

    const [result] = await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated successfully' });

  } catch (error) {
    console.error('User role update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has orders
    const [orders] = await pool.execute(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
      [id]
    );

    if (orders[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with existing orders. Consider deactivating instead.' 
      });
    }

    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 