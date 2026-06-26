import Brand from "../models/Brand.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import { normalizeModel3DUrl, parseBoolean } from "../utils/model3d.js";

// 👮 ADMIN → Get all brands
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find()
      .populate("owner", "name email role");

    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUBLIC → Get all approved brands (for Home Page)
export const getApprovedBrands = async (req, res) => {
  try {
    const { category, subCategory } = req.query;
    let query = { isApproved: true };

    if (category || subCategory) {
      // Find all brands that have at least one product in this category/subcategory
      let prodQuery = {};
      if (category) prodQuery.category = category;
      if (subCategory) prodQuery.subCategory = subCategory;

      const brandIds = await Product.find(prodQuery).distinct('brand');
      query._id = { $in: brandIds };
    }

    const brands = await Brand.find(query)
      .select("name logo bannerImage description");
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👮 ADMIN → Approve / Reject brand
export const updateBrandStatus = async (req, res) => {
  try {
    const { isApproved } = req.body;

    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    brand.isApproved = isApproved;
    await brand.save();

    res.json({
      message: `Brand ${isApproved ? "approved" : "rejected"} successfully`,
      brand
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUBLIC → Get Brand by ID
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ BRAND OWNER → Get My Brand Profile
export const getMyBrand = async (req, res) => {
  try {
    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) return res.status(404).json({ message: "Brand not found" });
    res.json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ BRAND OWNER → Update My Brand Profile
export const updateBrandProfile = async (req, res) => {
  try {
    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const { name, description, supportEmail, phone } = req.body;

    brand.name = name || brand.name;
    brand.description = description || brand.description;
    brand.supportEmail = supportEmail || brand.supportEmail;
    brand.phone = phone || brand.phone;

    // Handle files if uploaded (simplistic implementation)
    if (req.files) {
      if (req.files.logo) brand.logo = req.files.logo[0].filename;
      if (req.files.bannerImage) brand.bannerImage = req.files.bannerImage[0].filename;
    }

    await brand.save();
    res.json({ message: "Brand profile updated successfully", brand });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ BRAND OWNER → Get My Dashboard
export const getBrandDashboard = async (req, res) => {
  try {
    // return res.json({ debug: "If you see this, the API is reachable" }); // UNCOMMENT THIS TO TEST

    if (!req.user) {
      console.error("Dashboard Error: req.user is undefined in verifyToken");
      return res.status(401).json({ message: "User not authenticated" });
    }

    console.log("Fetching dashboard for user:", req.user._id, "Role:", req.user.role);

    // 1. Find the brand owned by this user
    const brand = await Brand.findOne({ owner: req.user._id });

    if (!brand) {
      console.log("No brand found for user:", req.user._id);
      return res.status(404).json({ message: "No brand found for this user." });
    }

    // 2. Aggregate Stats
    const { days } = req.query;
    let dateFilter = {};
    if (days && !isNaN(days)) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      dateFilter = { createdAt: { $gte: startDate } };
    }

    // A. Count Products
    const productCount = await Product.countDocuments({ brand: brand._id });

    // B. Find Orders containing this brand's products
    // First, find all product IDs for this brand
    const brandProducts = await Product.find({ brand: brand._id }).select('_id');
    const brandProductIds = brandProducts.map(p => p._id);

    const ordersQuery = {
      "items.productId": { $in: brandProductIds },
      ...dateFilter
    };

    const orders = await Order.find(ordersQuery)
      .populate("items.productId")
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    // Calculate detailed stats from these orders
    let totalRevenue = 0;
    let totalOrders = orders.length;
    let pendingOrders = 0;
    const productSalesMap = {}; // To track sales per product

    const periodLabel = days ? `Last ${days} Days` : "All Time";

    orders.forEach(order => {
      if (order.orderStatus === 'pending') pendingOrders++;

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item && item.productId) {
            const itemId = item.productId._id ? item.productId._id.toString() : item.productId.toString();
            if (brandProductIds.some(id => id.toString() === itemId)) {
              totalRevenue += (item.price || 0) * (item.quantity || 1);

              // Track sales for Top Sellers
              if (!productSalesMap[itemId]) {
                productSalesMap[itemId] = {
                  name: item.productId.name || "Unknown Product",
                  price: item.price || 0,
                  salesCount: 0,
                  image: item.productId.images?.[0] || ""
                };
              }
              productSalesMap[itemId].salesCount += (item.quantity || 1);
            }
          }
        });
      }
    });

    // Sort to get top 3 sellers
    const topSellers = Object.values(productSalesMap)
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 3);

    res.json({
      brand: {
        _id: brand._id,
        name: brand.name,
        logo: brand.logo || "",
        isApproved: brand.isApproved
      },
      stats: {
        period: periodLabel,
        products: productCount,
        orders: totalOrders,
        revenue: totalRevenue,
        pendingOrders: pendingOrders,
        topSellers: topSellers,
        recentActivities: orders.slice(0, 5).map(order => {
          // Calculate amount for this brand only
          const brandAmount = order.items.reduce((sum, item) => {
            const itemId = item.productId._id ? item.productId._id.toString() : item.productId.toString();
            if (brandProductIds.some(id => id.toString() === itemId)) {
              return sum + (item.price * item.quantity);
            }
            return sum;
          }, 0);

          return {
            orderId: order._id.toString().slice(-6).toUpperCase(),
            customerName: order.userId?.name || "Guest",
            status: order.orderStatus,
            amount: brandAmount,
            createdAt: order.createdAt
          };
        })
      }
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    res.status(500).json({
      message: "Internal Server Error in Dashboard API",
      error: error.message,
      stack: error.stack
    });
  }
};

// 🛡️ BRAND OWNER → Get My Customers (Aggregated from Orders)
export const getBrandCustomers = async (req, res) => {
  try {
    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    // Find all product IDs for this brand
    const brandProducts = await Product.find({ brand: brand._id }).select('_id');
    const brandProductIds = brandProducts.map(p => p._id.toString());

    // Find all orders that have products from this brand
    const orders = await Order.find({
      "items.productId": { $in: brandProductIds }
    }).populate("userId", "name email createdAt");

    // Group by User
    const customerMap = {};

    orders.forEach(order => {
      if (!order.userId) return;

      const userId = order.userId._id.toString();

      if (!customerMap[userId]) {
        customerMap[userId] = {
          _id: userId,
          name: order.userId.name,
          email: order.userId.email,
          customerSince: order.userId.createdAt,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt
        };
      }

      customerMap[userId].totalOrders += 1;

      // Calculate how much they spent on THIS brand in this order
      const brandAmount = order.items.reduce((sum, item) => {
        if (brandProductIds.includes(item.productId.toString())) {
          return sum + (item.price * item.quantity);
        }
        return sum;
      }, 0);

      customerMap[userId].totalSpent += brandAmount;

      if (new Date(order.createdAt) > new Date(customerMap[userId].lastOrderDate)) {
        customerMap[userId].lastOrderDate = order.createdAt;
      }
    });

    res.json(Object.values(customerMap));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ BRAND OWNER → Get My Orders
export const getMyOrders = async (req, res) => {
  try {
    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const brandProducts = await Product.find({ brand: brand._id }).select('_id');
    const brandProductIds = brandProducts.map(p => p._id);

    const orders = await Order.find({
      "items.productId": { $in: brandProductIds }
    })
      .populate("items.productId")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    // Filter items to only show this brand's items if needed, or return all
    // For now, return the whole order but identifying the brand's contribution
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ BRAND OWNER → Update Order Status
export const updateBrandOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId } = req.params;

    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Verify this brand actually has products in this order
    const brandProducts = await Product.find({ brand: brand._id }).select('_id');
    const brandProductIds = brandProducts.map(p => p._id.toString());

    const hasBrandProduct = order.items.some(item =>
      brandProductIds.includes(item.productId.toString())
    );

    if (!hasBrandProduct) {
      return res.status(403).json({ message: "You don't have permission to update this order" });
    }

    order.orderStatus = status;
    await order.save();

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ BRAND OWNER → Get My Products
export const getMyProducts = async (req, res) => {
  try {
    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const products = await Product.find({ brand: brand._id })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ BRAND OWNER → Create Product
export const createBrandProduct = async (req, res) => {
  try {
    const { name, productId, sku, description, price, category, subCategory, stock, sizes, colors, model3DUrl, is3DEnabled } = req.body;

    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    // Handle multiple images and sizeChart from multer (upload.fields)
    let images = [];
    let sizeChart = null;

    if (req.files) {
      if (req.files.images) {
        images = req.files.images.map(file => file.filename);
      }
      if (req.files.sizeChart) {
        sizeChart = req.files.sizeChart[0].filename;
      }
    }

    if (!name || !productId || !price || !category || !stock) {
      return res.status(400).json({ message: "Name, Product ID, price, category, and stock are required" });
    }

    if (images.length === 0) {
      return res.status(400).json({ message: "At least one product image is required" });
    }

    const normalized3DUrl = normalizeModel3DUrl(model3DUrl);
    const enable3D = normalized3DUrl
      ? (is3DEnabled !== undefined ? parseBoolean(is3DEnabled) : true)
      : false;

    const newProduct = new Product({
      name: name.trim(),
      productId: productId.trim(),
      sku: sku || "",
      description: description || "",
      price: parseFloat(price),
      category,
      subCategory: subCategory || "",
      brand: brand._id,
      stock: parseInt(stock),
      images,
      sizeChart,
      sizes: sizes ? (Array.isArray(sizes) ? sizes : JSON.parse(sizes)) : [],
      colors: colors ? (Array.isArray(colors) ? colors : JSON.parse(colors)) : [],
      model3DUrl: normalized3DUrl,
      is3DEnabled: enable3D,
      isActive: true
    });

    await newProduct.save();

    res.status(201).json({
      message: "Product published successfully",
      product: newProduct
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ BRAND OWNER → Delete My Product
export const deleteBrandProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Verify ownership
    if (product.brand.toString() !== brand._id.toString()) {
      return res.status(403).json({ message: "You don't have permission to delete this product" });
    }

    // Delete associated images and sizeChart from filesystem
    const fs = await import('fs');
    const path = await import('path');

    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        const imgPath = path.join('uploads/', img);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      });
    }

    if (product.sizeChart) {
      const sizeChartPath = path.join('uploads/', product.sizeChart);
      if (fs.existsSync(sizeChartPath)) {
        fs.unlinkSync(sizeChartPath);
      }
    }

    await Product.findByIdAndDelete(id);

    res.json({ message: "Product deleted successfully from database" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ BRAND OWNER → Update Product
export const updateBrandProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, productId, sku, description, price, category, subCategory, stock, sizes, colors, isActive, model3DUrl, is3DEnabled } = req.body;

    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Verify ownership
    if (product.brand.toString() !== brand._id.toString()) {
      return res.status(403).json({ message: "You don't have permission to update this product" });
    }

    // Update basic fields
    if (name) product.name = name.trim();
    if (productId) product.productId = productId.trim();
    if (sku !== undefined) product.sku = sku;
    if (description !== undefined) product.description = description;
    if (price) product.price = parseFloat(price);
    if (category) product.category = category;
    if (subCategory !== undefined) product.subCategory = subCategory;
    if (stock !== undefined) product.stock = parseInt(stock);
    if (isActive !== undefined) product.isActive = isActive;
    if (sizes) product.sizes = Array.isArray(sizes) ? sizes : JSON.parse(sizes);
    if (colors) product.colors = Array.isArray(colors) ? colors : JSON.parse(colors);
    if (model3DUrl !== undefined) {
      const normalized3DUrl = normalizeModel3DUrl(model3DUrl);
      const hadUrl = !!product.model3DUrl?.trim();
      product.model3DUrl = normalized3DUrl;

      if (!normalized3DUrl) {
        product.is3DEnabled = false;
      } else if (is3DEnabled !== undefined) {
        product.is3DEnabled = parseBoolean(is3DEnabled);
      } else if (!hadUrl) {
        product.is3DEnabled = true;
      }
    } else if (is3DEnabled !== undefined) {
      product.is3DEnabled = parseBoolean(is3DEnabled) && !!product.model3DUrl?.trim();
    }

    // Handle File Updates
    if (req.files) {
      if (req.files.images && req.files.images.length > 0) {
        // Option A: Append new images
        // product.images = [...product.images, ...req.files.images.map(f => f.filename)];

        // Option B: Replace all images (Standard for simple edit)
        product.images = req.files.images.map(f => f.filename);
      }
      if (req.files.sizeChart) {
        product.sizeChart = req.files.sizeChart[0].filename;
      }
    }

    await product.save();
    res.json({ message: "Product updated successfully", product });

  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🛡️ BRAND OWNER → Toggle 3D preview only
export const toggleProduct3D = async (req, res) => {
  try {
    const { id } = req.params;
    const { is3DEnabled } = req.body;

    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.brand.toString() !== brand._id.toString()) {
      return res.status(403).json({ message: "You don't have permission to update this product" });
    }

    if (!product.model3DUrl?.trim()) {
      return res.status(400).json({ message: "Add a 3D model URL before enabling 3D preview" });
    }

    product.model3DUrl = normalizeModel3DUrl(product.model3DUrl);
    product.is3DEnabled = parseBoolean(is3DEnabled);
    await product.save();

    res.json({
      message: "3D preview setting updated",
      product
    });
  } catch (error) {
    console.error("Toggle 3D Error:", error);
    res.status(500).json({ message: error.message });
  }
};

