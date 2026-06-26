import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: "admin@myapp.com" });

        if (existingAdmin) {
            console.log("Admin user already exists!");
            console.log("Email: admin@myapp.com");

            // Update role to admin if not already
            if (existingAdmin.role !== "admin") {
                existingAdmin.role = "admin";
                await existingAdmin.save();
                console.log("Role updated to admin!");
            }
        } else {
            // Create admin user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("admin123", salt);

            const adminUser = new User({
                name: "Admin User",
                email: "admin@myapp.com",
                password: hashedPassword,
                role: "admin"
            });

            await adminUser.save();
            console.log("✅ Admin user created successfully!");
            console.log("📧 Email: admin@myapp.com");
            console.log("🔑 Password: admin123");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

createAdminUser();
