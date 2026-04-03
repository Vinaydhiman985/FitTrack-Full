import mongoose from 'mongoose';

const stepsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    steps: { type: Number, required: true, default: 0 },
    distance: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Steps', stepsSchema);