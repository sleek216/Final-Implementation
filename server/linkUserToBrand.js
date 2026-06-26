import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from './models/Brand.js';
import User from './models/User.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const linkUserToBrand = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error("MONGODB_URI is not defined in .env");
            process.exit(1);
        }
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const userEmail = "brand@test.com"; // CHANGE THIS if needed
        const brandName = "Gucci"; // CHANGE THIS if needed

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            console.log(`User not found: ${userEmail}`);
            process.exit(1);
        }

        const brand = await Brand.findOne({ name: brandName });
        if (!brand) {
            console.log(`Brand not found: ${brandName}`);
            process.exit(1);
        }

        brand.owner = user._id;
        await brand.save();

        console.log(`Successfully linked Brand '${brand.name}' to User '${user.email}'`);

        // Also update user role just in case
        user.role = 'brandowner';
        await user.save();
        console.log(`Ensure User role is 'brandowner'`);

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

linkUserToBrand();
