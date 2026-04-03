import Steps from '../models/steps.model.js';
import User from '../models/user.model.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const stepsHistory = await Steps.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(7);
    const allUsers = await User.find().sort({ totalSteps: -1 }).select('_id');
    const rank = allUsers.findIndex((u) => u._id.toString() === req.user._id.toString()) + 1;
    res.status(200).json({
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        profilePic: user.profilePic || null,
        coins: user.coins,
        xp: user.xp,
        level: user.level,
        totalSteps: user.totalSteps,
        ownedAvatars: user.ownedAvatars,
        rank,
        stepsHistory,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, profilePic } = req.body;
    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (profilePic !== undefined) updateFields.profilePic = profilePic;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true }
    ).select('-password');
    res.status(200).json({ message: 'Profile updated!', data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};