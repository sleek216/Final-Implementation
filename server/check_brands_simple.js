import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from './models/Brand.js';

dotenv.config();

async function checkBrands() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const brands = await Brand.find({}, 'name businessEmail isApproved status');
        console.log('Registered Brands:');
        brands.forEach(b => console.log(`- ${b.name} (${b.businessEmail}) [Approved: ${b.isApproved}, Status: ${b.status}]`));

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkBrands();
