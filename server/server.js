import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import Category from './models/Category.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
dotenv.config();

const app = express();

// Initialize default categories
const initializeDefaultCategories = async () => {
  try {
    // Initialization logic removed - categories are now created on demand by admin
    console.log('Category management ready - admins can add Women, Men, Kids anytime');
  } catch (error) {
    console.error('Error initializing categories:', error.message);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from server/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/settings", settingRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB and then start server
const startServer = async () => {
  try {
    await connectDB();

    // Initialize default categories
    await initializeDefaultCategories();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    // Note: Don't exit process here because nodemon will try to restart
  }
};

startServer();
