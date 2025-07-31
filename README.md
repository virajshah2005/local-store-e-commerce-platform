# 🛍️ Local Store E-Commerce Platform

A full-stack e-commerce platform built for local stores with modern features, secure payments, and comprehensive order management.

![Local Store E-Commerce](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![Express](https://img.shields.io/badge/Express-4.18.2-black)

## ✨ Features

### 🛒 **Shopping Experience**
- **Product Catalog** with categories and filtering
- **Advanced Search** with price range and sorting
- **Shopping Cart** with persistent storage
- **Wishlist** functionality
- **Product Reviews & Ratings**

### 💳 **Payment & Billing**
- **Multiple Payment Gateways**: Cash on Delivery, Netbanking, Paytm, PayPal, PhonePe
- **Comprehensive Billing**: GST (CGST/SGST), delivery charges, discounts
- **INR Currency** formatting throughout
- **Order History** with detailed tracking

### 👤 **User Management**
- **User Registration & Authentication**
- **Profile Management** with edit capabilities
- **Password Change** with validation
- **Order Tracking** and history
- **Dark/Light/System Theme** toggle

### 🎨 **Modern UI/UX**
- **Responsive Design** for all devices
- **Dark Mode Support** with system preference
- **Beautiful Animations** and transitions
- **Modern UI Components** with Tailwind CSS
- **Accessibility** features

### 🔧 **Admin Features**
- **Admin Dashboard** with analytics
- **Product Management** (CRUD operations)
- **Order Management** with status updates
- **User Management** and role control
- **Category Management**

### 🛡️ **Security & Performance**
- **JWT Authentication** with secure tokens
- **Input Validation** on both frontend and backend
- **SQL Injection Protection**
- **Rate Limiting** and security headers
- **Database Connection Pooling**

## 🚀 Tech Stack

### **Frontend**
- **React 18** with Vite for fast development
- **React Router DOM** for client-side routing
- **React Query** for data fetching and caching
- **React Hook Form** for form management
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Framer Motion** for animations

### **Backend**
- **Node.js** with Express.js
- **MySQL** database with connection pooling
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **multer** for file uploads
- **helmet** for security headers

### **Database**
- **MySQL 8.0** with proper indexing
- **Normalized Schema** for data integrity
- **Foreign Key Constraints** for referential integrity
- **Transaction Support** for data consistency

## 📦 Installation

### **Prerequisites**
- Node.js 18+ 
- MySQL 8.0+
- Git

### **1. Clone the Repository**
```bash
git clone https://github.com/virajshah2005/local-store-e-commerce-platform.git
cd local-store-e-commerce-platform
```

### **2. Install Dependencies**
```bash
# Install all dependencies (frontend + backend)
npm run install-all
```

### **3. Database Setup**
```bash
# Create database and tables
npm run setup-db
```

### **4. Environment Configuration**
Create `.env` file in the `backend` directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=local_store_db
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

### **5. Start Development Server**
```bash
# Start both frontend and backend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🎯 Usage

### **For Customers**
1. **Browse Products**: Visit the homepage to see featured products
2. **Create Account**: Register for a new account or login
3. **Add to Cart**: Add products to your shopping cart
4. **Checkout**: Complete your order with payment
5. **Track Orders**: View order history and status

### **For Admins**
1. **Login**: Use admin credentials (admin@localstore.com / admin123)
2. **Dashboard**: Access admin panel for management
3. **Manage Products**: Add, edit, or remove products
4. **Process Orders**: Update order statuses
5. **View Analytics**: Monitor sales and user activity

## 📁 Project Structure

```
local-store-e-commerce-platform/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Cart, Theme)
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.jsx         # Main application component
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                # Node.js backend application
│   ├── routes/            # API route handlers
│   ├── middleware/        # Custom middleware
│   ├── database/          # Database setup and config
│   ├── uploads/           # File upload directory
│   └── server.js          # Express server setup
├── package.json           # Root package.json for scripts
└── README.md             # Project documentation
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run server           # Start backend only
npm run client           # Start frontend only

# Database
npm run setup-db         # Setup database and tables
npm run reset-db         # Reset database (development)

# Build
npm run build            # Build frontend for production
```

## 🌟 Key Features in Detail

### **🛒 Shopping Cart**
- Persistent cart across sessions
- Guest cart syncs to account upon login
- Real-time stock validation
- Quantity management

### **💳 Payment System**
- Multiple payment methods
- GST calculation (CGST + SGST)
- Delivery charge calculation
- Discount application
- Comprehensive billing breakdown

### **🎨 Theme System**
- Dark mode support
- Light mode support
- System preference detection
- Persistent theme selection

### **📱 Responsive Design**
- Mobile-first approach
- Tablet optimization
- Desktop enhancement
- Touch-friendly interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Vite** for the fast build tool
- **Express.js** for the backend framework
- **MySQL** for the reliable database

## 📞 Support

If you have any questions or need support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for Local Stores**
