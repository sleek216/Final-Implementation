import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';

dotenv.config();

const listCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const categories = await Category.find();
        console.log('Categories:', categories);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listCategories();
