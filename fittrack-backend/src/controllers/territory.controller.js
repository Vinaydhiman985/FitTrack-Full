import asyncHandler from '../utils/asyncHandler.js';
import Territory from '../models/territory.model.js';

// @desc    List all claimed territories
// @route   GET /api/territory
export const listTerritories = asyncHandler(async (req, res) => {
  const territories = await Territory.find({})
    .populate('owner', 'name avatar level')
    .sort({ updatedAt: -1 })
    .limit(500);
  res.json({ data: territories });
});

// @desc    Claim or update a territory
// @route   POST /api/territory/claim
export const claimTerritory = asyncHandler(async (req, res) => {
  const { gridKey, color, latitude, longitude } = req.body;

  if (!gridKey) {
    res.status(400);
    throw new Error('Grid key is required');
  }

  const territory = await Territory.findOneAndUpdate(
    { gridKey },
    {
      owner: req.user._id,
      color: color || '#00bcd4',
      latitude,
      longitude,
      claimedAt: Date.now(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('owner', 'name avatar level');

  res.json({ message: 'Territory claimed successfully', data: territory });
});

// @desc    Battle for a territory
// @route   POST /api/territory/battle
export const battleTerritory = asyncHandler(async (req, res) => {
  const { gridKey, defenderId, winnerId } = req.body;

  if (!gridKey) {
    res.status(400);
    throw new Error('Grid key is required');
  }

  const territory = await Territory.findOne({ gridKey });
  if (!territory) {
    res.status(404);
    throw new Error('Territory not found');
  }

  const battle = {
    attacker: req.user._id,
    defender: defenderId || territory.owner,
    winner: winnerId || req.user._id,
    at: new Date(),
  };

  territory.battleHistory.push(battle);
  territory.lastBattleAt = battle.at;
  territory.owner = battle.winner;
  
  await territory.save();
  await territory.populate('owner', 'name avatar level');

  res.json({ message: 'Battle completed', data: territory });
});
