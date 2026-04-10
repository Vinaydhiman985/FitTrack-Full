import mongoose from 'mongoose';

const leaderboardEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: 'blaze' },
    totalSteps: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    rank: { type: Number, default: 0 },
  },
  { _id: false }
);

const leaderboardSnapshotSchema = new mongoose.Schema(
  {
    period: { type: String, enum: ['daily', 'weekly', 'all-time'], default: 'daily' },
    date: { type: String, required: true },
    entries: [leaderboardEntrySchema],
  },
  { timestamps: true }
);

leaderboardSnapshotSchema.index({ period: 1, date: 1 }, { unique: true });

export default mongoose.model('LeaderboardSnapshot', leaderboardSnapshotSchema);
