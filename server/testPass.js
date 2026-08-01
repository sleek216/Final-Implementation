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
        await mongoose.connect(uri);
        const email = "221400097@gift.edu.pk";
        const user = await User.findOne({ email });
        if (!user) {
            console.error("User not found!");
            process.exit(1);
        }
        console.log("User email:", user.email);
        console.log("User role:", user.role);
        console.log("User password hash:", user.password);
        console.log("User tempPassword:", user.tempPassword);
        
        const isMatch = await bcrypt.compare("rahmeer123", user.password);
        console.log("Does 'rahmeer123' match user.password?", isMatch);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
