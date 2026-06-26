import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import fs from "fs";

dotenv.config();

const logStream = fs.createWriteStream("debug_output.txt", { flags: 'w' });

function log(message) {
    if (typeof message === 'object') {
        message = JSON.stringify(message, null, 2);
    }
    console.log(message);
    logStream.write(message + "\n");
}

const debugUsers = async () => {
    try {
        log("Connecting to DB: " + process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        log("Connected.");

        const adminEmail = "admin@myapp.com";
        const admin = await User.findOne({ email: adminEmail });

        if (admin) {
            log("\nAdmin user found. verifying role...");
            // Force reset password to be sure
            const bcrypt = await import("bcryptjs");
            const salt = await bcrypt.default.genSalt(10);
            const hashedPassword = await bcrypt.default.hash("admin123", salt);

            admin.password = hashedPassword;
            admin.role = "admin";
            await admin.save();
            log("✅ Admin password reset to 'admin123' and role verified.");

        } else {
            log("\n❌ Admin user NOT found. Creating it...");
            const bcrypt = await import("bcryptjs");
            const salt = await bcrypt.default.genSalt(10);
            const hashedPassword = await bcrypt.default.hash("admin123", salt);

            const newAdmin = new User({
                name: "System Admin",
                email: adminEmail,
                password: hashedPassword,
                role: "admin"
            });
            await newAdmin.save();
            log("✅ Admin user CREATED: admin@myapp.com / admin123");
        }

        process.exit(0);
    } catch (e) {
        log("DEBUG ERROR: " + e.message);
        process.exit(1);
    }
};

debugUsers();
