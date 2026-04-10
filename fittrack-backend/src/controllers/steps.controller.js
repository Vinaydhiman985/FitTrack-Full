import asyncHandler from '../utils/asyncHandler.js';
import Steps from '../models/steps.model.js';
import User from '../models/user.model.js';

const XP_PER_LEVEL = 5000;
const STEP_TO_KM = 0.000762;
const STEP_TO_CAL = 0.04;

const getTodayDateKey = () => new Date().toISOString().split('T')[0];

// @desc    Log steps
// @route   POST /api/steps/log
export const logSteps = asyncHandler(async (req, res) => {
  const stepsToAdd = Number(req.body.steps || 0);

  if (stepsToAdd <= 0) {
    res.status(400);
    throw new Error('Please provide a positive number of steps');
  }

  const userId = req.user._id;
  const dateStr = getTodayDateKey();

  // Find or create steps log for today
  let stepsLog = await Steps.findOne({ userId, date: dateStr });
  if (!stepsLog) {
    stepsLog = new Steps({ userId, date: dateStr });
  }

  // Calculate earnings
  const earnedCoins = Math.floor(stepsToAdd / 100);
  const earnedXp = Math.floor(stepsToAdd / 50);

  // Update today's log
  stepsLog.steps += stepsToAdd;
  stepsLog.distance = Number((stepsLog.steps * STEP_TO_KM).toFixed(2));
  stepsLog.calories = Number((stepsLog.steps * STEP_TO_CAL).toFixed(2));
  stepsLog.coins += earnedCoins;
  stepsLog.xp += earnedXp;
  await stepsLog.save();

  // Update cumulative user stats
  const user = await User.findById(userId);
  user.totalSteps += stepsToAdd;
  user.coins += earnedCoins;
  user.xp += earnedXp;

  // Handle Level Up
  while (user.xp >= XP_PER_LEVEL) {
    user.xp -= XP_PER_LEVEL;
    user.level += 1;
  }
  await user.save();

  res.json({
    message: 'Steps logged successfully',
    today: {
      steps: stepsLog.steps,
      distance: stepsLog.distance,
      calories: stepsLog.calories,
      coins: stepsLog.coins,
      xp: stepsLog.xp,
    },
    totals: {
      totalSteps: user.totalSteps,
      coins: user.coins,
      xp: user.xp,
      level: user.level,
    }
  });
});

// @desc    Get today's steps
// @route   GET /api/steps/today
export const getTodaySteps = asyncHandler(async (req, res) => {
  const dateStr = getTodayDateKey();
  const log = await Steps.findOne({ userId: req.user._id, date: dateStr });

  if (log) {
    res.json(log);
  } else {
    res.json({
      steps: 0,
      distance: 0,
      calories: 0,
      coins: 0,
      xp: 0,
      date: dateStr,
    });
  }
});

// @desc    Get steps history
// @route   GET /api/steps/history
export const getStepsHistory = asyncHandler(async (req, res) => {
  const history = await Steps.find({ userId: req.user._id })
    .sort({ date: -1 })
    .limit(30);
  res.json(history);
});
