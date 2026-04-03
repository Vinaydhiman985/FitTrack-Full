import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: 'blaze' },
    coins: { type: Number, default: 100 }, // start with 100 coins!
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    ownedAvatars: { type: [String], default: ['blaze'] },
    totalSteps: { type: Number, default: 0 },
    profilePic: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationExpiry: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);