import mongoose from 'mongoose';
import Product from './server/models/Product.js';

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/FashionVerse');
        const products = await Product.find({ name: /Kurta/i }, 'name colors brand').populate('brand', 'name');
        console.log(JSON.stringify(products, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
};

run();
