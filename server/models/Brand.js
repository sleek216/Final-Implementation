import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    // Owner is initially null, assigned upon approval
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    businessEmail: {
      type: String,
      required: true
    },
    websiteUrl: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    supportEmail: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    logo: {
      type: String,
      default: ""
    },
    bannerImage: {
      type: String,
      default: ""
    },
    heroImage: {
      type: String,
      default: ""
    },
    verificationDocument: {
      type: String,
      required: false // path to uploaded file
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    rejectionReason: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("Brand", brandSchema);
