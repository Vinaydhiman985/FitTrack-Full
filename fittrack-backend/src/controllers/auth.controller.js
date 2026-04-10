import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';

const signToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '30d' });
};

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  ownedAvatars: user.ownedAvatars,
  coins: user.coins,
  xp: user.xp,
  level: user.level,
  totalSteps: user.totalSteps,
  profilePic: user.profilePic,
});

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    avatar: 'blaze',
    ownedAvatars: ['blaze'],
    coins: 100,
    xp: 0,
    level: 1,
    isVerified: true, // Auto-verify for now as per original logic
  });

  if (user) {
    res.status(201).json({
      message: 'User registered successfully',
      token: signToken(user._id),
      user: buildUserResponse(user),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      message: 'Login successful',
      token: signToken(user._id),
      user: buildUserResponse(user),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get all users (Admin/Debug)
// @route   GET /api/auth/users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});
