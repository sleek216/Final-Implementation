import mongoose from "mongoose";

const colorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    hexCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: "#000000"
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Color", colorSchema);
