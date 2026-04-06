import User from '../models/user.model.js';

// Keep this list in sync with mobile constants/AVATAR_CONFIGS for prices + ids
const AVATARS = [
  { id: 'blaze',  name: 'Blaze',         price: 0 },
  { id: 'nova',   name: 'Nova',          price: 500 },
  { id: 'surge',  name: 'Surge',         price: 800 },
  { id: 'viper',  name: 'Viper',         price: 1500 },
  { id: 'frost',  name: 'Frost',         price: 2500 },
  { id: 'legend', name: 'Legend',        price: 5000 },
  // 3D-inspired additions (placeholder assets; swap URLs in production)
  {
    id: 'fae',
    name: 'Fae Warden',
    price: 800,
    previewStill: 'https://placehold.co/480x640/0f172a/9ef0c1?text=Fae+Warden+3D',
    modelUrl: null,
  },
  {
    id: 'cyber',
    name: 'Cyber Ninja',
    price: 1500,
    previewStill: 'https://placehold.co/480x640/0f172a/7dd3fc?text=Cyber+Ninja+3D',
    modelUrl: null,
  },
  {
    id: 'mech',
    name: 'Pocket Mech',
    price: 2500,
    previewStill: 'https://placehold.co/480x640/1f2937/c4b5fd?text=Pocket+Mech+3D',
    modelUrl: null,
  },
  {
    id: 'astral',
    name: 'Astral Scout',
    price: 5000,
    previewStill: 'https://placehold.co/480x640/0b1220/7dd3fc?text=Astral+Scout+3D',
    modelUrl: null,
  },
];

export const getAvatars = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const avatars = AVATARS.map((avatar) => ({
      ...avatar,
      owned: user.ownedAvatars.includes(avatar.id),
      equipped: user.avatar === avatar.id,
    }));
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
      avatar,
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
