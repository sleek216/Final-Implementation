import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Brand from './models/Brand.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const brand = await Brand.findOne({ name: "oufitters" });
        const user = await User.findOne({ email: "admin@myapp.com" }); // Using admin as customer

        if (!brand || !user) {
            console.error("Brand or User not found");
            process.exit(1);
        }

        // 1. Create Products
        const products = await Product.insertMany([
            {
                name: "Classic Denim Jacket",
                description: "A timeless classic denim jacket.",
                price: 85,
                category: "Apparel",
                brand: brand._id,
                images: ["https://example.com/denim.jpg"],
                stock: 50,
                isActive: true
            },
            {
                name: "Leather Boots",
                description: "High quality leather boots.",
                price: 120,
                category: "Footwear",
                brand: brand._id,
                images: ["https://example.com/boots.jpg"],
                stock: 30,
                isActive: true
            }
        ]);
        console.log(`${products.length} products created.`);

        // 2. Create Orders
        const order = await Order.create({
            userId: user._id,
            items: [
                {
                    productId: products[0]._id,
                    quantity: 1,
                    price: products[0].price
                },
                {
                    productId: products[1]._id,
                    quantity: 2,
                    price: products[1].price
                }
            ],
            totalAmount: products[0].price + (products[1].price * 2),
            shippingAddress: {
                name: "John Doe",
                address: "123 Street",
                city: "New York",
                country: "USA"
            },
            paymentMethod: "credit_card",
            paymentStatus: "completed",
            orderStatus: "pending"
        });
        console.log("Order created.");

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

seedData();
