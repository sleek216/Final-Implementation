import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    itemCount: {
      type: Number,
      default: 0
    },
    subCategories: [
      {
        name: { type: String, required: true },
        description: { type: String, default: "" }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
