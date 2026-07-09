import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import axios from 'axios';

// Helper to notify Python Flask recommendation service of data changes
const triggerRecommendationRefresh = () => {
  axios.post('http://127.0.0.1:5001/refresh-data')
    .then(() => {
      console.log('[Recommendation] Triggered recommendation data refresh successfully');
    })
    .catch((error) => {
      console.error('[Recommendation] Failed to trigger recommendation refresh:', error.message);
    });
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const { category, subCategory, brand, page = 1, limit = 10, days, isNewArrival } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (brand) query.brand = brand;

    if (days || isNewArrival) {
      const dayCount = days ? parseInt(days) : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dayCount);
      query.createdAt = { $gte: startDate };
    }

    const products = await Product.find(query)
      .populate("brand", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by ID (supports both MongoDB _id and custom productId)
export const getProductById = async (req, res) => {
  try {
    let product = null;
    const id = req.params.id;

    // First try MongoDB ObjectId lookup
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id)
        .populate("brand", "name")
        .populate("reviews.userId", "name username");
    }

    // If not found by _id, try custom productId field
    if (!product) {
      product = await Product.findOne({ productId: id })
        .populate("brand", "name")
        .populate("reviews.userId", "name username");
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create product (admin only)
export const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    triggerRecommendationRefresh();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product (admin only)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    triggerRecommendationRefresh();
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete product (admin only)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    triggerRecommendationRefresh();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Add review to product
export const addReview = async (req, res) => {
  try {
    const { rating, comment, title } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = {
      userId: req.user._id,
      rating: Number(rating),
      comment,
      title,
      createdAt: new Date(),
    };

    product.reviews.push(review);

    // Update product rating
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    // Populate before sending back so frontend has user details immediately
    const populatedProduct = await Product.findById(product._id)
      .populate("brand", "name")
      .populate("reviews.userId", "name username");

    res.status(201).json({ message: 'Review added successfully', product: populatedProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET BRANDS FOR COMPARISON
export const getComparisonBrands = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Standardized Color Match (Direct string comparison)
    const productColors = product.colors || [];

    const query = {
      _id: { $ne: product._id },
      category: product.category,
      brand: { $ne: product.brand },
      isActive: true,
      colors: { $in: productColors } // Any product sharing at least one standardized color
    };

    if (product.subCategory) {
      query.subCategory = product.subCategory;
    }

    const candidates = await Product.find(query).distinct('brand');
    const brands = await Brand.find({ _id: { $in: candidates } });
    
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PRODUCTS FOR COMPARISON BY BRANDS
export const getComparisonProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { brandIds } = req.query;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const brandIdArray = brandIds ? brandIds.split(',') : [];
    const productColors = product.colors || [];

    const query = {
      _id: { $ne: product._id },
      category: product.category,
      brand: { $in: brandIdArray, $ne: product.brand },
      isActive: true,
      colors: { $in: productColors }
    };

    if (product.subCategory) {
      query.subCategory = product.subCategory;
    }

    const matchingProducts = await Product.find(query).populate("brand", "name");
    res.json(matchingProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
