import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Brand from './models/Brand.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const listData = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log("Connected to MongoDB\n");

        const users = await User.find({}, 'email role');
        console.log("--- USERS ---");
        users.forEach(u => console.log(`${u._id} | ${u.email} [${u.role}]`));

        const brands = await Brand.find({});
        console.log("\n--- BRANDS, PRODUCTS & ORDERS ---");
        for (const b of brands) {
            const productCount = await mongoose.model("Product").countDocuments({ brand: b._id });
            const brandProducts = await mongoose.model("Product").find({ brand: b._id }).select('_id');
            const productIds = brandProducts.map(p => p._id);
            const orderCount = await mongoose.model("Order").countDocuments({ "items.productId": { $in: productIds } });

            console.log(`${b.name}`);
            console.log(`  Owner ID: ${b.owner || 'None'}`);
            console.log(`  Logo:     ${b.logo || 'None'}`);
            console.log(`  Desc:     ${b.description || 'None'}`);
            console.log(`  Products: ${productCount}`);
            console.log(`  Orders:   ${orderCount}`);
        }

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

listData();
