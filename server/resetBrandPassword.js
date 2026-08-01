import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const run = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error("MONGODB_URI is not defined in .env");
            process.exit(1);
        }
        await mongoose.connect(uri);
        const email = "221400097@gift.edu.pk";
        const user = await User.findOne({ email });
        if (!user) {
            console.error("User not found!");
            process.exit(1);
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("rahmeer123", salt);
        user.password = hashedPassword;
        await user.save();
        console.log("SUCCESS: Password for 221400097@gift.edu.pk reset to 'rahmeer123'");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
