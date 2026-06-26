import mongoose from "mongoose";

const uri = "mongodb+srv://hyberistics7617_db_user:On7LrwaYWqMvugeN@cluster0.5od8xrz.mongodb.net/fashionverse";

const testCloud = async () => {
    try {
        console.log("Testing Cloud Connection...");
        await mongoose.connect(uri);
        console.log("✅ SUCCESS! Connected to Cloud DB.");
        process.exit(0);
    } catch (e) {
        console.error("❌ FAILED:", e.message);
        process.exit(1);
    }
};

testCloud();
