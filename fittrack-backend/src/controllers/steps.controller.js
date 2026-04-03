import Steps from '../models/steps.model.js';
import User from '../models/user.model.js';

const XP_PER_LEVEL = 5000;

export const logSteps = async (req, res) => {
  try {
    const { steps: stepsToAdd } = req.body;
    const userId = req.user._id;

    if (!stepsToAdd || stepsToAdd <= 0) {
      return res.status(400).json({ error: 'Valid steps increment is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 1) Find or create today's steps log
    let stepsLog = await Steps.findOne({ userId, date: today });
    if (!stepsLog) {
      stepsLog = new Steps({ userId, date: today, steps: 0, distance: 0, calories: 0, coins: 0, xp: 0 });
    }

    // 2) Add the new steps
    stepsLog.steps += stepsToAdd;
    
    // 3) Recalculate daily totals based on the new total steps
    stepsLog.distance = parseFloat((stepsLog.steps * 0.000762).toFixed(2));
    stepsLog.calories = parseFloat((stepsLog.steps * 0.04).toFixed(2));
    
    // 4) Calculate new rewards earned from this specific increment
    const coinsEarned = Math.floor(stepsToAdd / 100);
    const xpEarned = Math.floor(stepsToAdd / 50);
    
    stepsLog.coins += coinsEarned;
    stepsLog.xp += xpEarned;
    await stepsLog.save();

    // 5) Update global User stats
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.totalSteps += stepsToAdd;
    user.coins += coinsEarned;
    user.xp += xpEarned;

    while (user.xp >= XP_PER_LEVEL) {
      user.xp -= XP_PER_LEVEL;
      user.level += 1;
    }

    await user.save();
    
    const todayData = {
      steps: stepsLog.steps,
      distance: stepsLog.distance,
      calories: stepsLog.calories,
      coins: stepsLog.coins,
      xp: stepsLog.xp,
      date: stepsLog.date,
    };

    return res.status(200).json({
      message: 'Steps updated',
      data: todayData,
      totals: {
        totalSteps: user.totalSteps,
        coins: user.coins,
        xp: user.xp,
        level: user.level,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTodaySteps = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stepsLog = await Steps.findOne({ userId: req.user._id, date: today });
    res.status(200).json({ data: stepsLog || { steps: 0, distance: 0, calories: 0, coins: 0, xp: 0, date: today } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStepsHistory = async (req, res) => {
  try {
    const history = await Steps.find({ userId: req.user._id }).sort({ date: -1 }).limit(7);
    res.status(200).json({ data: history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
