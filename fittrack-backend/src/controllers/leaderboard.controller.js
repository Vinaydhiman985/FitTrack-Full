import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.model.js';
import LeaderboardSnapshot from '../models/leaderboard.model.js';

// @desc    Get top users leaderboard
// @route   GET /api/leaderboard
export const getLeaderboard = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('name avatar totalSteps coins xp level')
    .sort({ totalSteps: -1 })
    .limit(20);

  const leaderboard = users.map((user, index) => ({
    rank: index + 1,
    id: user._id,
    name: user.name,
    avatar: user.avatar || 'blaze',
    totalSteps: user.totalSteps || 0,
    coins: user.coins || 0,
    xp: user.xp || 0,
    level: user.level || 1,
  }));

  // Optionally update daily snapshot
  const today = new Date().toISOString().split('T')[0];
  try {
    await LeaderboardSnapshot.findOneAndUpdate(
      { period: 'daily', date: today },
      { entries: leaderboard.map(({ id, ...rest }) => ({ user: id, ...rest })) },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('[leaderboard] failed to save snapshot:', err.message);
  }

  res.json({ data: leaderboard });
});
