// [EXISTING IMPORTS]
import Brand from "../models/Brand.js";
import multer from "multer";
import path from "path";

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
        const { brandName, businessEmail, websiteUrl, brandCategory } = req.body;

        // Check if brand name or email already exists (basic check)
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

        res.status(201).json({
            message: "Brand application submitted successfully. Pending approval.",
            brand
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
