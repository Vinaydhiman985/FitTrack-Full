import mongoose from 'mongoose';

const shopItemSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['avatar', 'boost', 'bundle', 'cosmetic'], default: 'avatar' },
    price: { type: Number, required: true, min: 0 },
    previewFile: { type: String },
    modelFile: { type: String },
    active: { type: Boolean, default: true },
    metadata: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.model('ShopItem', shopItemSchema);
