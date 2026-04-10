import mongoose from 'mongoose';

const territorySchema = new mongoose.Schema(
  {
    gridKey: { type: String, required: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    color: { type: String, default: '#00bcd4' },
    latitude: { type: Number },
    longitude: { type: Number },
    claimedAt: { type: Date, default: Date.now },
    lastBattleAt: { type: Date },
    battleHistory: [
      {
        attacker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        defender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);


export default mongoose.model('Territory', territorySchema);
