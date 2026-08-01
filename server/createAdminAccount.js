import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = "admin@myapp.com";
    const password = "admin123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = await User.findOne({ email });

    if (user) {
      user.password = hashedPassword;
      user.role = "admin";
      await user.save();
      console.log("Admin password updated to admin123");
    } else {
      user = await User.create({
        name: "Admin User",
        username: "admin",
        email: email,
        password: hashedPassword,
        role: "admin"
      });
      console.log("Admin created with password admin123");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

createAdmin();
