import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';

dotenv.config();

const fixCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const categories = await Category.find();
        for (const cat of categories) {
            const originalLength = cat.subCategories.length;
            cat.subCategories = cat.subCategories.filter(sub => sub.name && sub.name.trim() !== '');
            if (cat.subCategories.length !== originalLength) {
                console.log(`Cleaning category: ${cat.name}. Removed ${originalLength - cat.subCategories.length} invalid subcategories.`);
                await cat.save();
            }
        }

        console.log('Database cleanup complete');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixCategories();
