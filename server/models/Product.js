import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
    },
    productId: {
      type: String,
      required: [true, 'Please provide a product ID'],
      unique: true,
      sparse: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
    },
    subCategory: {
      type: String,
      required: false,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: false,
    },
    images: {
      type: [String],
      required: true,
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        title: String,
        comment: String,
        rating: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    sizeChart: {
      type: String,
      default: null,
    },
    model3DUrl: {
      type: String,
      default: "",
    },
    is3DEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
