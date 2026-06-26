import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const verifyAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: "admin@myapp.com" });
        if (user) {
            console.log(`Admin user verified: ${user.email}, Role: ${user.role}`);
        } else {
            console.log("Admin user NOT found.");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verifyAdmin();
