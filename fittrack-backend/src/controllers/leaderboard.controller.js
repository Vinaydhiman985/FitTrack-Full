import User from '../models/user.model.js';

export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .select('name avatar totalSteps coins xp level')
      .sort({ totalSteps: -1 })
      .limit(10);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      totalSteps: user.totalSteps,
      coins: user.coins,
      xp: user.xp,
      level: user.level,
    }));

    res.status(200).json({ data: leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};