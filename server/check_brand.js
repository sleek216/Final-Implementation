import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from './models/Brand.js';

dotenv.config();

const checkBrands = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const brands = await Brand.find({});
        console.log('--- All Brands ---');
        brands.forEach(b => {
            console.log(`Name: ${b.name}, Status: ${b.status}, isApproved: ${b.isApproved}, Email: ${b.businessEmail}`);
        });

        const pendingQuery = {
            $or: [
                { status: "pending" },
                { status: { $exists: false }, isApproved: false }
            ]
        };
        const pending = await Brand.find(pendingQuery);
        console.log('\n--- Brands Matching Pending Query ---');
        pending.forEach(b => {
            console.log(`Name: ${b.name}, Status: ${b.status}, isApproved: ${b.isApproved}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkBrands();
