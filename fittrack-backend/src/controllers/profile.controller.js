import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.model.js';
import Steps from '../models/steps.model.js';

// @desc    Get user profile
// @route   GET /api/profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  const stepsHistory = await Steps.find({ userId: user._id })
    .sort({ date: -1 })
    .limit(30);

  // Simple rank calculation based on total steps
  const aheadCount = await User.countDocuments({ totalSteps: { $gt: user.totalSteps } });
  const rank = aheadCount + 1;

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    profilePic: user.profilePic,
    coins: user.coins,
    xp: user.xp,
    level: user.level,
    totalSteps: user.totalSteps,
    ownedAvatars: user.ownedAvatars,
    rank,
    stepsHistory,
    distance: Number((user.totalSteps * 0.000762).toFixed(2)),
  });
});

// @desc    Update user profile
// @route   PUT /api/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, profilePic } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.name = name || user.name;
    user.profilePic = profilePic !== undefined ? profilePic : user.profilePic;

    const updatedUser = await user.save();

    res.json({
      message: 'Profile updated successfully',
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      profilePic: updatedUser.profilePic,
      coins: updatedUser.coins,
      xp: updatedUser.xp,
      level: updatedUser.level,
      totalSteps: updatedUser.totalSteps,
      ownedAvatars: updatedUser.ownedAvatars,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});
