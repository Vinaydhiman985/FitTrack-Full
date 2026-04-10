import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, index: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);
