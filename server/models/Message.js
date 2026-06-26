import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false
        },
        status: {
            type: String,
            enum: ["unread", "read"],
            default: "unread"
        }
    },
    { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
