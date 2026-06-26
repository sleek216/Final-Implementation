import mongoose from "mongoose";
import dotenv from "dotenv";
import Brand from "./models/Brand.js";
import fs from "fs";

dotenv.config();

const logStream = fs.createWriteStream("debug_brand_output.txt", { flags: 'w' });

function log(msg) {
    console.log(msg);
    if (typeof msg === 'object') msg = JSON.stringify(msg);
    logStream.write(msg + "\n");
}

const debugBrand = async () => {
    try {
        log("Connecting to DB: " + process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        log("Connected.");

        const dummyBrand = {
            name: "Test Brand " + Date.now(),
            businessEmail: "test" + Date.now() + "@brand.com",
            websiteUrl: "https://test.com",
            category: "mens",
            verificationDocument: "dummy_doc.pdf",
            isApproved: false
        };

        log("Attempting to save brand:");
        log(dummyBrand);

        const newBrand = await Brand.create(dummyBrand);
        log("✅ Brand SAVED successfully!");
        log("ID: " + newBrand._id);

        // Verify it's there
        const found = await Brand.findById(newBrand._id);
        if (found) {
            log("✅ Brand RETRIEVED successfully!");
        } else {
            log("❌ Brand saved but NOT found immediately?");
        }

        process.exit(0);
    } catch (e) {
        log("❌ INSERTION ERROR: " + e.message);
        if (e.errors) {
            Object.keys(e.errors).forEach(key => {
                log(`Validation Error [${key}]: ${e.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

debugBrand();
