import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

async function createOrResetTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const email = "customer@fashionverse.com";
    const password = "password123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = await User.findOne({ email });

    if (user) {
      user.password = hashedPassword;
      user.role = "customer";
      await user.save();
      console.log("Updated existing test customer account:", email);
    } else {
      user = await User.create({
        name: "Test Customer",
        username: "testcustomer",
        email: email,
        phone: "03001234567",
        password: hashedPassword,
        role: "customer"
      });
      console.log("Created new test customer account:", email);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

createOrResetTestUser();
