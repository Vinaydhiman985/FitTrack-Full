import User from '../models/user.model.js';

// Keep this list in sync with mobile constants/AVATAR_CONFIGS for prices + ids.
// Assets are resolved at runtime using buildAvatarWithAssets().
const AVATARS = [
  { id: 'blaze',  name: 'Blaze',         price: 0,    previewFile: 'blaze.png',  modelFile: null },
  { id: 'nova',   name: 'Nova',          price: 500,  previewFile: 'nova.png',   modelFile: null },
  { id: 'surge',  name: 'Surge',         price: 800,  previewFile: 'surge.png',  modelFile: null },
  { id: 'viper',  name: 'Viper',         price: 1500, previewFile: 'viper.png',  modelFile: null },
  { id: 'frost',  name: 'Frost',         price: 2500, previewFile: 'frost.png',  modelFile: null },
  { id: 'legend', name: 'Legend',        price: 5000, previewFile: 'legend.png', modelFile: null },
  // 3D-inspired additions (drop your GLB/PNG into /public/avatars and set modelFile/previewFile)
  { id: 'fae',    name: 'Fae Warden',    price: 800,  previewFile: 'fae.png',    modelFile: 'fae.glb' },
  { id: 'cyber',  name: 'Cyber Ninja',   price: 1500, previewFile: 'cyber.png',  modelFile: 'cyber.glb' },
  { id: 'mech',   name: 'Pocket Mech',   price: 2500, previewFile: 'mech.png',   modelFile: 'mech.glb' },
  { id: 'astral', name: 'Astral Scout',  price: 5000, previewFile: 'astral.png', modelFile: 'astral.glb' },
];

const buildAssetBase = (req) => {
  if (process.env.ASSET_BASE_URL) return process.env.ASSET_BASE_URL.replace(/\/+$/, '');
  const host = req.get('host');
  return `${req.protocol}://${host}/static/avatars`;
};

const buildAvatarWithAssets = (avatar, req) => {
  const base = buildAssetBase(req);
  return {
    ...avatar,
    previewStill: avatar.previewFile ? `${base}/${avatar.previewFile}` : avatar.previewStill || null,
    modelUrl: avatar.modelFile ? `${base}/${avatar.modelFile}` : avatar.modelUrl || null,
  };
};

export const getAvatars = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const avatars = AVATARS.map((avatar) => {
      const enriched = buildAvatarWithAssets(avatar, req);
      return {
        ...enriched,
        owned: user.ownedAvatars.includes(avatar.id),
        equipped: user.avatar === avatar.id,
      };
    });
    res.status(200).json({ data: avatars, coins: user.coins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const buyAvatar = async (req, res) => {
  try {
    const { avatarId } = req.body;
    const user = await User.findById(req.user._id);
    const avatar = AVATARS.find((a) => a.id === avatarId);
    if (!avatar) return res.status(404).json({ error: 'Avatar not found' });
    if (user.ownedAvatars.includes(avatarId)) return res.status(400).json({ error: 'Avatar already owned' });
    if (user.coins < avatar.price) return res.status(400).json({ error: 'Not enough coins' });
    user.coins -= avatar.price;
    user.ownedAvatars.push(avatarId);
    await user.save();
    res.status(200).json({
      message: avatar.name + ' purchased!',
      coins: user.coins,
      ownedAvatars: user.ownedAvatars,
      avatar: buildAvatarWithAssets(avatar, req),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const equipAvatar = async (req, res) => {
  try {
    const { avatarId } = req.body;
    const user = await User.findById(req.user._id);
    const avatar = AVATARS.find((a) => a.id === avatarId);
    if (!avatar) return res.status(404).json({ error: 'Avatar not found' });
    if (!user.ownedAvatars.includes(avatarId)) return res.status(400).json({ error: 'Avatar not owned' });
    user.avatar = avatarId;
    await user.save();
    res.status(200).json({ message: avatar.name + ' equipped!', avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
