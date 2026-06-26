import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: false
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "brand", "customer", "brandowner", "brandOwner", "user"],
      lowercase: true,
      default: "customer"
    },

    bio: {
      type: String,
      default: ""
    },

    location: {
      type: String,
      default: ""
    },
    image: {
      type: String,
      default: ""
    },

    resetOtp: {
      type: String,
      default: null
    },

    resetOtpExpires: {
      type: Date,
      default: null
    },
    
    tempPassword: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
