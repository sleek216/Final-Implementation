import User from "../models/User.js";
import Brand from "../models/Brand.js";
import Otp from "../models/Otp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { sendOtpEmail, sendRegistrationOtpEmail, sendBrandRegistrationEmail } from "../utils/emailService.js";

// Multer Config for Verification Docs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure 'uploads/verifications' exists
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'verification-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadVerification = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed!'), false);
    }
  }
});

// REGISTER BRAND
export const registerBrand = async (req, res) => {
  try {
    const { brandName, businessEmail, websiteUrl, brandCategory, otp } = req.body;

    // 1. Verify OTP
    const otpRecord = await Otp.findOne({
      email: businessEmail.toLowerCase(),
      otp: otp,
      purpose: "registration"
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 2. Check if brand exists
    const existingBrand = await Brand.findOne({
      $or: [{ name: brandName }, { businessEmail: businessEmail }]
    });

    if (existingBrand) {
      return res.status(400).json({ message: "Brand name or email already registered" });
    }

    const brand = await Brand.create({
      name: brandName,
      businessEmail,
      websiteUrl,
      category: brandCategory,
      verificationDocument: req.file ? req.file.filename : "",
      isApproved: false
    });

    // 3. Delete OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    // Send Wait Email
    sendBrandRegistrationEmail(businessEmail, brandName);

    res.status(201).json({
      message: "Brand application submitted successfully. Pending approval.",
      brand
    });

  } catch (error) {
    console.error("Brand Registration Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// SEND REGISTRATION OTP
export const sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : "";

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Upsert OTP
    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose: "registration" },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await sendRegistrationOtpEmail(email, otp);

    res.json({ message: "Verification OTP sent to your email" });
  } catch (error) {
    console.error("Send Registration OTP Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, username, otp } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : "";

    // 1. Verify OTP
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp: otp,
      purpose: "registration"
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 2. Check user exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Fallback username if not provided
    const finalUsername = username || email.split('@')[0];

    // 5. Create user
    const user = await User.create({
      name,
      username: finalUsername,
      email,
      phone,
      password: hashedPassword,
      role: role || "customer"
    });

    // 6. Delete OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(201).json({
      message: "Registration successful!",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Register User Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const identifier = req.body.email ? req.body.email.toLowerCase().trim() : "";

    console.log(`Login attempt for: ${identifier}`);

    // Find user by email OR username
    const user = await User.findOne({ 
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });

    if (!user) {
      console.log(`User not found: ${identifier}`);
      return res.status(404).json({ message: "User not found" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    
    // Fallback: If it's a brand owner, check if their tempPassword matches (in case hash is old)
    let authenticated = isMatch;
    if (!authenticated && user.tempPassword && password === user.tempPassword) {
      console.log(`Authenticated via tempPassword for ${user.email}. Re-hashing password...`);
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      authenticated = true;
    }

    if (!authenticated) {
      console.log(`Invalid credentials for: ${identifier}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`Login successful for: ${user.email} (Role: ${user.role})`);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = req.body.name || user.name;
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.location = req.body.location !== undefined ? req.body.location : user.location;

    if (req.file) {
      user.image = req.file.filename;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      location: updatedUser.location,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PASSWORD
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid current password" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== OTP-BASED FORGOT PASSWORD ====================

// Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// FORGOT PASSWORD - Request OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Received forgot password request for:', email);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    // Generate OTP and set expiry (10 minutes)
    const otp = generateOtp();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    // Try to send OTP via email (non-blocking)
    try {
      await sendOtpEmail(user.email, otp);
      console.log(`✅ OTP sent successfully to ${user.email}`);
    } catch (emailError) {
      console.error('⚠️ Email sending failed, but OTP is saved:', emailError.message);
      console.log('======================================');
      console.log(`📧 OTP for ${user.email}: ${otp}`);
      console.log('======================================');
      // Continue without failing - OTP is still saved in DB
    }

    res.json({
      message: "OTP sent to your email address",
      email: user.email
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Failed to process request. Please try again." });
  }
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetOtp: otp,
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP is valid - generate a temporary token for password reset
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      message: "OTP verified successfully",
      resetToken
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired reset session" });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.resetOtp = null;
    user.resetOtpExpires = null;

    await user.save();

    res.json({ message: "Password reset successfully. You can now login with your new password." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: error.message });
  }
};
