# FashionVerse - Full Stack Fashion E-commerce Application

A complete MERN (MongoDB, Express, React, Node.js) stack application for an online fashion store.

## Project Structure

```
FashionVerse/
├── server/                 # Backend API
│   ├── config/            # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── .env.example        # Environment variables template
│   ├── package.json        # Server dependencies
│   └── server.js           # Main server file
├── client/                 # Frontend React app
│   ├── src/               # Source code
│   ├── public/            # Static files
│   ├── vite.config.js     # Vite configuration
│   ├── package.json       # Client dependencies
│   └── .env.example       # Environment variables template
└── package.json           # Root package.json for development
```

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/m-hamza1/FashionVerse.git
cd FashionVerse
```

### 2. Install Dependencies

Install all dependencies (root, server, and client):
```bash
npm run install-all
```

Or install separately:

**For Server:**
```bash
cd server
npm install
```

**For Client:**
```bash
cd client
npm install
```

### 3. Setup Environment Variables

**Server (.env file in server/):**
```bash
cp server/.env.example server/.env
```

Edit `server/.env` and configure:
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - Token expiration time

**Client (.env file in client/):**
```bash
cp client/.env.example client/.env
```

Edit `client/.env` and configure:
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## Running the Application

### Development Mode

Run both server and client concurrently:
```bash
npm run dev
```

Or run separately:

**Start Server:**
```bash
npm run server
```

**Start Client (in another terminal):**
```bash
npm run client
```

- Client: http://localhost:3000
- Server: http://localhost:5000
- API: http://localhost:5000/api

### Production Build

```bash
npm run build
```

### Start Server Only
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `POST /api/orders` - Create order (protected)
- `GET /api/orders` - Get user orders (protected)
- `GET /api/orders/:id` - Get order details (protected)
- `PUT /api/orders/:id/status` - Update order status (admin only)
- `PUT /api/orders/:id/cancel` - Cancel order (protected)

## Database Schema

### User Model
- name, email, password, phone, avatar
- address, city, state, zipCode, country
- role (user/admin), isActive, timestamps

### Product Model
- name, description, price, discount
- category, images, sizes, colors
- stock, rating, reviews, isActive, timestamps

### Order Model
- userId, items, totalAmount
- shippingAddress, paymentMethod
- paymentStatus, orderStatus, timestamps

## Features

- User authentication with JWT
- Product catalog with filters
- Shopping cart functionality
- Order management
- Admin panel for product management
- User profile management
- Role-based access control

## Future Enhancements

- Payment gateway integration (Stripe, PayPal)
- Email notifications
- Advanced product filtering and search
- Wishlist functionality
- Product reviews and ratings
- Inventory management
- Analytics dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@fashionverse.com or create an issue in the repository.
