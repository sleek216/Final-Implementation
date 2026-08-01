import User from "../models/User.js";
import Brand from "../models/Brand.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import Color from "../models/Color.js";
import Setting from "../models/Setting.js";
import { sendBrandApprovalEmail, sendBrandRejectionEmail } from "../utils/emailService.js";
import multer from "multer";
import path from "path";

// Multer configuration for brand images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/brands/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'brand-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const { search, filter, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // EXPLICITLY only show customers/users
    query.role = { $in: ["customer", "user"] };

    // Additional safeguard: Exclude anyone with "Owner" in their name from this list
    query.name = { $not: /Owner/i };

    // Apply search filter
    if (search) {
      query.$and = [
        { role: { $in: ["customer", "user"] } },
        { name: { $not: /Owner/i } },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Apply status filter
    if (filter === 'active') {
      // already excluding brand roles, just keep it active
    } else if (filter === 'inactive') {
      query.role = 'suspended';
    }

    const users = await User.find(query)
      .select("-password") // Still exclude hashed password, but keep everything else
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE USER ROLE
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({
      message: "User role updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN DASHBOARD STATS
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBrandOwners = await User.countDocuments({
      role: { $in: ["brand", "brandowner"] }
    });

    const totalBrands = await Brand.countDocuments();
    const pendingBrands = await Brand.countDocuments({ isApproved: false });

    // Added: Get Total Products
    const totalProducts = await Product.countDocuments();

    // Added: Get Total Orders
    const totalOrders = await Order.countDocuments();

    // Added: Get Recent Activities (Real-time data from multiple sources)
    const [recentUsers, recentOrders, recentBrands] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5),
      Order.find().populate('userId', 'name').sort({ createdAt: -1 }).limit(5),
      Brand.find().sort({ createdAt: -1 }).limit(5)
    ]);

    // Combine and format activities
    let allActivities = [
      ...recentUsers.map(user => ({
        type: 'user',
        icon: "icon-users",
        iconColor: "blue",
        title: "New User Registration",
        description: `${user.name} joined the platform`,
        status: "Completed",
        timestamp: user.createdAt,
        time: new Date(user.createdAt).toLocaleString()
      })),
      ...recentOrders.map(order => ({
        type: 'order',
        icon: "icon-shopping-cart",
        iconColor: "green",
        title: "New Order Placed",
        description: `Order #${order._id.toString().slice(-6)} by ${order.userId?.name || 'Guest'}`,
        status: order.orderStatus || "Pending",
        timestamp: order.createdAt,
        time: new Date(order.createdAt).toLocaleString()
      })),
      ...recentBrands.map(brand => ({
        type: 'brand',
        icon: "icon-award",
        iconColor: "purple",
        title: "Brand Registration",
        description: `${brand.name} requested verification`,
        status: brand.isApproved ? "Approved" : "Pending",
        timestamp: brand.createdAt,
        time: new Date(brand.createdAt).toLocaleString()
      }))
    ];

    // Sort all by most recent
    const recentActivities = allActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8); // Show top 8 recent activities

    res.json({
      totalUsers,
      totalBrandOwners,
      totalBrands,
      pendingBrands,
      totalProducts,
      totalOrders,
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SETTINGS
export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE SETTINGS
export const updateSettings = async (req, res) => {
  try {
    const updateData = req.body;
    let settings = await Setting.findOne();
    
    if (!settings) {
      settings = new Setting(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    
    await settings.save();
    res.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL BRANDS
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find()
      .populate("owner", "name email role tempPassword");

    // Fix for older brands: if tempPassword is null, populate it based on brand name pattern
    const brandsWithPasswords = await Promise.all(brands.map(async (brand) => {
      if (brand.isApproved && brand.owner && !brand.owner.tempPassword) {
        const guessedPassword = brand.name.replace(/\s+/g, '').toLowerCase();
        
        // Update both tempPassword and hashed password for consistency
        const salt = await import("bcryptjs").then(m => m.default.genSalt(10));
        const hashedPassword = await import("bcryptjs").then(m => m.default.hash(guessedPassword, salt));
        
        await User.findByIdAndUpdate(brand.owner._id, { 
          tempPassword: guessedPassword,
          password: hashedPassword 
        });
        
        brand.owner.tempPassword = guessedPassword;
      }
      return brand;
    }));

    res.json(brandsWithPasswords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE BRAND STATUS (APPROVE/REJECT)
export const updateBrandStatus = async (req, res) => {
  try {
    const { isApproved } = req.body;

    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    brand.isApproved = isApproved;
    brand.status = isApproved ? "approved" : "rejected";
    await brand.save();

    res.json({
      message: `Brand ${isApproved ? "approved" : "rejected"} successfully`,
      brand
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE BRAND
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Delete associated files from filesystem
    const fs = await import('fs');
    const path = await import('path');

    const filesToDelete = [brand.logo, brand.bannerImage, brand.heroImage, brand.verificationDocument].filter(Boolean);

    filesToDelete.forEach(file => {
      // Handles both absolute-ish saved paths and just filenames
      const fileName = path.basename(file);
      const possiblePaths = [
        path.join('uploads/', fileName),
        path.join('uploads/brands/', fileName)
      ];

      possiblePaths.forEach(p => {
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
        }
      });
    });

    await Brand.findByIdAndDelete(req.params.id);

    res.json({ message: "Brand and associated assets deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PENDING VERIFICATIONS (PENDING BRANDS)
export const getPendingVerifications = async (req, res) => {
  try {
    const pendingBrands = await Brand.find({
      isApproved: false,
      status: { $ne: "rejected" }
    })
      .populate("owner", "name email role");

    res.json(pendingBrands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// APPROVE VERIFICATION
export const approveVerification = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Check if brand already has an owner (already approved)
    if (brand.owner) {
      return res.status(400).json({ message: "Brand is already verified and has an owner" });
    }

    // Use Brand Name as password (remove spaces, lowercase)
    const generatedPassword = brand.name.replace(/\s+/g, '').toLowerCase();

    // Create new User for Brand Owner
    const salt = await import("bcryptjs").then(m => m.default.genSalt(10));
    const hashedPassword = await import("bcryptjs").then(m => m.default.hash(generatedPassword, salt));

    const newUser = new User({
      name: brand.name + " Owner",
      email: brand.businessEmail,
      password: hashedPassword,
      tempPassword: generatedPassword, // STORE PLAIN PASSWORD TEMPORARILY
      role: "brand"
    });

    await newUser.save();

    // Link User to Brand and Approve
    brand.owner = newUser._id;
    brand.isApproved = true;
    brand.status = "approved";
    await brand.save();

    // Send Approval Email with Credentials (Non-blocking)
    sendBrandApprovalEmail(brand.businessEmail, brand.name, generatedPassword);

    res.json({
      message: "Brand verified successfully. Account created.",
      brand,
      credentials: {
        email: brand.businessEmail,
        password: generatedPassword
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REJECT VERIFICATION
export const rejectVerification = async (req, res) => {
  try {
    const { reason } = req.body;
    console.log(`Rejecting Brand ID: ${req.params.id} with reason: ${reason}`);

    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      console.log(`Brand not found: ${req.params.id}`);
      return res.status(404).json({ message: "Brand not found" });
    }

    console.log(`Brand found: ${brand.name}, Business Email: ${brand.businessEmail}`);

    brand.isApproved = false;
    brand.status = "rejected";
    brand.rejectionReason = reason || "";
    await brand.save();

    console.log(`Status updated to 'rejected' in database`);

    // Send Rejection Email (Non-blocking)
    if (reason) {
      console.log(`Queuing rejection email for ${brand.businessEmail}...`);
      sendBrandRejectionEmail(brand.businessEmail, brand.name, reason);
    }

    res.json({
      message: "Brand verification rejected",
      brand
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL ORDERS
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("items.productId", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = orderStatus;
    await order.save();

    res.json({
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPLOAD BRAND HERO IMAGE
export const uploadBrandImage = async (req, res) => {
  try {
    const { brandId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Delete old image if exists
    if (brand.heroImage) {
      const fs = await import('fs');
      const path = await import('path');
      const oldImagePath = path.join('uploads/brands/', path.basename(brand.heroImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    brand.heroImage = req.file.filename;
    await brand.save();

    res.json({
      message: "Brand hero image uploaded successfully",
      brand,
      imageUrl: `/uploads/brands/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REMOVE HERO IMAGE
export const removeHeroImage = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    if (brand.heroImage) {
      const fs = await import('fs');
      const path = await import('path');
      const oldImagePath = path.join('uploads/brands/', path.basename(brand.heroImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    brand.heroImage = "";
    await brand.save();

    res.json({ message: "Hero image removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== CATEGORY MANAGEMENT ==========

// GET ALL CATEGORIES
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: { $regex: name, $options: 'i' } });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({
      name: name.trim(),
      description: description || ""
    });

    await category.save();
    res.status(201).json({
      message: "Category created successfully",
      category
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    await category.save();

    res.json({
      message: "Category updated successfully",
      category
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({
      message: "Category deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD SUB-CATEGORY
export const addSubCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Sub-category name is required" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if sub-category already exists in this category
    const exists = category.subCategories.some(sub => 
      sub.name && name && sub.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ message: "Sub-category already exists in this category" });
    }

    category.subCategories.push({ name: name.trim(), description: description || "" });
    await category.save();

    res.status(201).json({
      message: "Sub-category added successfully",
      category
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE SUB-CATEGORY
export const deleteSubCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.subCategories = category.subCategories.filter(
      sub => sub._id.toString() !== subCategoryId
    );

    await category.save();
    res.json({
      message: "Sub-category deleted successfully",
      category
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== PRODUCT MANAGEMENT ==========

// GET ALL PRODUCTS (Admin)
export const getAllProducts = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Apply search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Apply status filter
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const products = await Product.find(query)
      .populate('brand', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE PRODUCT (Admin)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, brand, stock, images, isActive, sizeChart } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: "Name, price, and category are required" });
    }

    const product = new Product({
      name: name.trim(),
      description: description || "",
      price: parseFloat(price),
      category,
      subCategory: subCategory || "",
      brand,
      stock: parseInt(stock) || 0,
      images: images || [],
      isActive: isActive !== undefined ? isActive : true,
      sizeChart: sizeChart || null
    });

    await product.save();
    await product.populate('brand', 'name');

    res.status(201).json({
      message: "Product created successfully",
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PRODUCT (Admin)
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, brand, stock, images, isActive, sizeChart } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update fields
    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (category !== undefined) product.category = category;
    if (subCategory !== undefined) product.subCategory = subCategory;
    if (brand !== undefined) product.brand = brand;
    if (stock !== undefined) product.stock = parseInt(stock);
    if (images !== undefined) product.images = images;
    if (isActive !== undefined) product.isActive = isActive;
    if (sizeChart !== undefined) product.sizeChart = sizeChart;

    await product.save();
    await product.populate('brand', 'name');

    res.json({
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE PRODUCT (Admin)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
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

    await Product.findByIdAndDelete(req.params.id);
    res.json({
      message: "Product and associated images deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// TOGGLE PRODUCT STATUS (Admin)
export const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();
    await product.populate('brand', 'name');

    res.json({
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== COLOR MANAGEMENT ==========

// GET ALL COLORS
export const getAllColors = async (req, res) => {
  try {
    const colors = await Color.find().sort({ createdAt: -1 });
    res.json(colors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE COLOR
export const createColor = async (req, res) => {
  try {
    const { name, hexCode } = req.body;

    if (!name || !hexCode) {
      return res.status(400).json({ message: "Color name and hex code are required" });
    }

    const existingColor = await Color.findOne({ 
      $or: [
        { name: { $regex: name, $options: 'i' } },
        { hexCode: { $regex: hexCode, $options: 'i' } }
      ]
    });
    
    if (existingColor) {
      return res.status(400).json({ message: "Color name or hex code already exists" });
    }

    const color = new Color({
      name: name.trim(),
      hexCode: hexCode.trim().startsWith('#') ? hexCode.trim() : `#${hexCode.trim()}`
    });

    await color.save();
    res.status(201).json({
      message: "Color created successfully",
      color
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE COLOR
export const updateColor = async (req, res) => {
  try {
    const { name, hexCode } = req.body;
    const color = await Color.findById(req.params.id);

    if (!color) {
      return res.status(404).json({ message: "Color not found" });
    }

    color.name = name || color.name;
    color.hexCode = hexCode || color.hexCode;
    await color.save();

    res.json({
      message: "Color updated successfully",
      color
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE COLOR
export const deleteColor = async (req, res) => {
  try {
    const color = await Color.findById(req.params.id);

    if (!color) {
      return res.status(404).json({ message: "Color not found" });
    }

    await Color.findByIdAndDelete(req.params.id);
    res.json({
      message: "Color deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { upload };

