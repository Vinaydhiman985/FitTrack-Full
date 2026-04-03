import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { sendWelcomeEmail } from '../config/email.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fittrack_default_secret';

// REGISTER — auto-verifies and returns token immediately
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: true, // auto-verify so user is logged in immediately
    });

    // Send welcome email in background (non-blocking)
    sendWelcomeEmail(email, name).catch(() => {});

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful! Welcome to FitTrack!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
        xp: user.xp,
        level: user.level,
      },
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // If user was created before auto-verify was enabled, verify them now on login
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        coins: user.coins,
        xp: user.xp,
        level: user.level,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
