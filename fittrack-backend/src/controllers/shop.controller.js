import asyncHandler from '../utils/asyncHandler.js';
import config from '../config/env.js';
import ShopItem from '../models/shopItem.model.js';
import User from '../models/user.model.js';

const DEFAULT_AVATARS = [
  { slug: 'blaze', name: 'Blaze', price: 0, previewFile: 'blaze.png', modelFile: null },
  { slug: 'nova', name: 'Nova', price: 500, previewFile: 'nova.png', modelFile: null },
  { slug: 'surge', name: 'Surge', price: 800, previewFile: 'surge.png', modelFile: null },
  { slug: 'viper', name: 'Viper', price: 1500, previewFile: 'viper.png', modelFile: null },
  { slug: 'frost', name: 'Frost', price: 2500, previewFile: 'frost.png', modelFile: null },
  { slug: 'legend', name: 'Legend', price: 5000, previewFile: 'legend.png', modelFile: null },
  { slug: 'fae', name: 'Fae Warden', price: 800, previewFile: 'fae.png', modelFile: 'fae.glb' },
  { slug: 'cyber', name: 'Cyber Ninja', price: 1500, previewFile: 'cyber.png', modelFile: 'cyber.glb' },
  { slug: 'mech', name: 'Pocket Mech', price: 2500, previewFile: 'mech.png', modelFile: 'mech.glb' },
  { slug: 'astral', name: 'Astral Scout', price: 5000, previewFile: 'astral.png', modelFile: 'astral.glb' },
];

const getAssetBaseUrl = (req) => {
  if (config.assetBaseUrl) return config.assetBaseUrl.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}/static/avatars`;
};

const formatAvatar = (item, req) => {
  const base = getAssetBaseUrl(req);
  return {
    ...item,
    id: item.slug,
    previewStill: item.previewFile ? `${base}/${item.previewFile}` : (item.previewStill || null),
    modelUrl: item.modelFile ? `${base}/${item.modelFile}` : (item.modelUrl || null),
  };
};

const ensureItemsSeeded = async () => {
  const count = await ShopItem.countDocuments();
  if (count === 0) {
    const items = DEFAULT_AVATARS.map(a => ({
      ...a,
      type: 'avatar',
      active: true,
      metadata: { seeded: true }
    }));
    await ShopItem.insertMany(items);
  }
};

// @desc    Get all active avatars
// @route   GET /api/shop/avatars
export const getAvatars = asyncHandler(async (req, res) => {
  await ensureItemsSeeded();
  const user = req.user;
  const items = await ShopItem.find({ type: 'avatar', active: true }).sort({ price: 1 });

  const avatars = items.map(item => {
    const avatarObj = item.toObject();
    const formatted = formatAvatar(avatarObj, req);
    return {
      ...formatted,
      owned: user.ownedAvatars.includes(item.slug),
      equipped: user.avatar === item.slug,
    };
  });

  res.json({ data: avatars, coins: user.coins });
});

// @desc    Buy an avatar
// @route   POST /api/shop/buy
export const buyAvatar = asyncHandler(async (req, res) => {
  const { avatarId } = req.body;
  const user = await User.findById(req.user._id);
  const item = await ShopItem.findOne({ slug: avatarId, type: 'avatar', active: true });

  if (!item) {
    res.status(404);
    throw new Error('Avatar not found');
  }

  if (user.ownedAvatars.includes(avatarId)) {
    res.status(400);
    throw new Error('You already own this avatar');
  }

  if (user.coins < item.price) {
    res.status(400);
    throw new Error('Not enough coins');
  }

  user.coins -= item.price;
  user.ownedAvatars.push(avatarId);
  await user.save();

  res.json({
    message: `${item.name} purchased successfully`,
    coins: user.coins,
    ownedAvatars: user.ownedAvatars,
    avatar: formatAvatar(item.toObject(), req)
  });
});

// @desc    Equip an avatar
// @route   POST /api/shop/equip
export const equipAvatar = asyncHandler(async (req, res) => {
  const { avatarId } = req.body;
  const user = await User.findById(req.user._id);
  
  if (!user.ownedAvatars.includes(avatarId)) {
    res.status(400);
    throw new Error('You do not own this avatar');
  }

  user.avatar = avatarId;
  await user.save();

  res.json({
    message: 'Avatar equipped successfully',
    avatar: user.avatar
  });
});
