import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from './models/Brand.js';

dotenv.config();

const migrateBrands = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Set status to 'approved' for all brands that are marked as isApproved: true but still have status: 'pending'
        const result = await Brand.updateMany(
            { isApproved: true, status: "pending" },
            { $set: { status: "approved" } }
        );

        console.log(`Updated ${result.modifiedCount} approved brands to status: 'approved'`);

        // Ensure all brands have a status
        const result2 = await Brand.updateMany(
            { status: { $exists: false }, isApproved: true },
            { $set: { status: "approved" } }
        );
        console.log(`Updated ${result2.modifiedCount} brands with missing status to 'approved'`);

        const result3 = await Brand.updateMany(
            { status: { $exists: false }, isApproved: false },
            { $set: { status: "pending" } }
        );
        console.log(`Updated ${result3.modifiedCount} brands with missing status to 'pending'`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrateBrands();
