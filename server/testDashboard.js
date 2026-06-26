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

const testDashboard = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const userEmail = "oufitters@gmail.com";
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.error("User not found");
            process.exit(1);
        }

        // Simulate getBrandDashboard logic
        const brand = await Brand.findOne({ owner: user._id });
        if (!brand) {
            console.error("Brand not found for user:", user._id);
            process.exit(1);
        }

        console.log("Brand found:", brand.name);

        const productCount = await Product.countDocuments({ brand: brand._id });
        const brandProducts = await Product.find({ brand: brand._id }).select('_id');
        const brandProductIds = brandProducts.map(p => p._id);

        console.log("Product IDs count:", brandProductIds.length);

        const orders = await Order.find({
            "items.productId": { $in: brandProductIds }
        }).populate("items.productId");

        console.log("Orders found:", orders.length);

        let totalRevenue = 0;
        let pendingOrders = 0;

        orders.forEach((order, idx) => {
            console.log(`Processing Order ${idx}: ${order._id}`);
            if (order.orderStatus === 'pending') pendingOrders++;

            order.items.forEach((item, iIdx) => {
                if (item.productId) {
                    const itemId = item.productId._id || item.productId;
                    if (brandProductIds.some(id => id.toString() === itemId.toString())) {
                        console.log(`  Matching item ${iIdx}: price ${item.price}, qty ${item.quantity}`);
                        totalRevenue += item.price * (item.quantity || 1);
                    }
                }
            });
        });

        console.log("Stats compiled:", {
            products: productCount,
            orders: orders.length,
            revenue: totalRevenue,
            pendingOrders: pendingOrders
        });

        process.exit();
    } catch (error) {
        console.error("Test Failed with Error:");
        console.error(error);
        process.exit(1);
    }
};

testDashboard();
