import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// CREATE REVIEW
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const userId = req.user.id;

    // 1. Check if order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, userId: userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found or unauthorized" });
    }

    // 2. Check if product is in that order
    const hasProduct = order.items.some(item => item.productId.toString() === productId);
    if (!hasProduct) {
      return res.status(400).json({ message: "Product not found in this order" });
    }

    // 3. Check if review already exists
    const existingReview = await Review.findOne({ user: userId, product: productId, order: orderId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product for this order" });
    }

    // 4. Create review
    const review = await Review.create({
      user: userId,
      product: productId,
      order: orderId,
      rating: Number(rating),
      comment
    });

    // 5. Update Product Rating & Reviews count (Legacy support if needed, or we just use Review model)
    // For now, let's update the Product model's average rating
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating.toFixed(1)
    });

    res.status(201).json({
      message: "Review submitted successfully!",
      review
    });

  } catch (error) {
    console.error("Create Review Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET PRODUCT REVIEWS
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER REVIEWS
export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate("product", "name images")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET TOP RATED PRODUCTS
export const getTopRatedProducts = async (req, res) => {
    try {
        const products = await Product.find({})
            .sort({ rating: -1 })
            .limit(8);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
