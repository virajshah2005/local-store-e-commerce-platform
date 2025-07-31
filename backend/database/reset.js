const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../config.env' });

const resetDatabase = async () => {
  let connection;
  
  try {
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔗 Connected to MySQL server');

    // Drop database if exists
    await connection.execute(`DROP DATABASE IF EXISTS ${process.env.DB_NAME || 'local_store_db'}`);
    console.log('🗑️ Dropped existing database');

    // Create database
    await connection.execute(`CREATE DATABASE ${process.env.DB_NAME || 'local_store_db'}`);
    console.log('📊 Database created successfully');

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'local_store_db'}`);

    // Create tables with new schema
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        sale_price DECIMAL(10,2),
        category_id INT,
        stock_quantity INT DEFAULT 0,
        image_url TEXT,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS cart_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        product_id INT,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        subtotal DECIMAL(10,2) NOT NULL,
        cgst_amount DECIMAL(10,2) DEFAULT 0.00,
        sgst_amount DECIMAL(10,2) DEFAULT 0.00,
        delivery_charges DECIMAL(10,2) DEFAULT 0.00,
        discount_amount DECIMAL(10,2) DEFAULT 0.00,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method ENUM('cod', 'netbanking', 'paytm', 'phonepe', 'paypal', 'card') DEFAULT 'cod',
        payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
        shipping_address TEXT NOT NULL,
        billing_address TEXT NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(100) NOT NULL,
        tracking_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT,
        product_id INT,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS reviews (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        product_id INT,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`
    ];

    for (const table of tables) {
      await connection.execute(table);
    }
    console.log('📋 Tables created successfully');

    // Insert sample data
    await insertSampleData(connection);
    
    console.log('✅ Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const insertSampleData = async (connection) => {
  try {
    // Insert categories
    const categories = [
      ['Electronics', 'Latest electronic gadgets and devices'],
      ['Clothing', 'Fashion and apparel for all ages'],
      ['Home & Garden', 'Home improvement and garden supplies'],
      ['Sports', 'Sports equipment and accessories'],
      ['Books', 'Books and educational materials']
    ];

    for (const [name, description] of categories) {
      await connection.execute(
        'INSERT IGNORE INTO categories (name, description) VALUES (?, ?)',
        [name, description]
      );
    }

    // Insert sample products
    const products = [
      ['iPhone 15 Pro', 'Latest iPhone with advanced features', 99999.99, 89999.99, 1, 50, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'],
      ['Samsung Galaxy S24', 'Premium Android smartphone', 89999.99, null, 1, 30, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'],
      ['Nike Air Max', 'Comfortable running shoes', 12999.99, 9999.99, 2, 100, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
      ['Adidas T-Shirt', 'Comfortable cotton t-shirt', 2999.99, null, 2, 200, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
      ['Coffee Maker', 'Automatic coffee machine', 8999.99, 6999.99, 3, 25, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'],
      ['Garden Hose', '50ft heavy-duty garden hose', 3999.99, null, 3, 75, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
      ['Basketball', 'Official size basketball', 4999.99, 3999.99, 4, 60, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400'],
      ['Yoga Mat', 'Non-slip yoga mat', 3499.99, null, 4, 80, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'],
      ['The Great Gatsby', 'Classic American novel', 1299.99, 999.99, 5, 150, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'],
      ['Programming Guide', 'Complete coding tutorial', 2499.99, null, 5, 100, 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400']
    ];

    for (const [name, description, price, sale_price, category_id, stock, image] of products) {
      await connection.execute(
        'INSERT IGNORE INTO products (name, description, price, sale_price, category_id, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, price, sale_price, category_id, stock, image]
      );
    }

    // Create admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(
      'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin User', 'admin@localstore.com', hashedPassword, 'admin']
    );

    // Create sample customer users
    const customerPassword = await bcrypt.hash('customer123', 10);
    await connection.execute(
      'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['John Doe', 'john@example.com', customerPassword, 'customer']
    );
    await connection.execute(
      'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Jane Smith', 'jane@example.com', customerPassword, 'customer']
    );
    await connection.execute(
      'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Mike Johnson', 'mike@example.com', customerPassword, 'customer']
    );

    // Insert sample reviews
    const reviews = [
      [1, 1, 5, 'Amazing phone! The camera quality is outstanding and the performance is lightning fast.'],
      [2, 1, 4, 'Great phone overall, but the battery could last a bit longer.'],
      [3, 1, 5, 'Best iPhone I\'ve ever owned. Worth every penny!'],
      [1, 2, 4, 'Excellent Android phone with great features.'],
      [2, 2, 5, 'Samsung has outdone themselves with this one.'],
      [1, 3, 4, 'Very comfortable shoes for running.'],
      [2, 3, 5, 'Perfect fit and great for daily use.'],
      [1, 4, 3, 'Good quality t-shirt, but runs a bit small.'],
      [2, 4, 4, 'Comfortable and durable material.'],
      [1, 5, 5, 'Makes the best coffee I\'ve ever tasted!'],
      [2, 5, 4, 'Easy to use and clean. Great purchase.'],
      [1, 6, 3, 'Good hose but could be longer.'],
      [2, 6, 4, 'Durable and doesn\'t kink easily.'],
      [1, 7, 5, 'Perfect basketball for outdoor courts.'],
      [2, 7, 4, 'Great grip and bounce.'],
      [1, 8, 4, 'Non-slip surface works perfectly.'],
      [2, 8, 5, 'Excellent quality yoga mat.'],
      [1, 9, 5, 'Classic novel, beautifully written.'],
      [2, 9, 4, 'Great story, highly recommended.'],
      [1, 10, 4, 'Very comprehensive programming guide.'],
      [2, 10, 5, 'Perfect for beginners and advanced users alike.']
    ];

    for (const [user_id, product_id, rating, comment] of reviews) {
      await connection.execute(
        'INSERT IGNORE INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
        [user_id, product_id, rating, comment]
      );
    }

    console.log('📦 Sample data inserted successfully');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  }
};

resetDatabase(); 