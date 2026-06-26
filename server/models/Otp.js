import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ["registration", "password-reset"],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '10m' } // Automatically delete document after 10 minutes
    }
}, { timestamps: true });

export default mongoose.model("Otp", otpSchema);
