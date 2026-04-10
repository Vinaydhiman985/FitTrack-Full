import asyncHandler from '../utils/asyncHandler.js';
import Session from '../models/session.model.js';

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(200).json({ data: sessions });
});

export const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body || {};
  const session = await Session.findOneAndUpdate(
    { _id: sessionId, user: req.user._id },
    { revoked: true, expiresAt: new Date() },
    { new: true }
  );
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.status(200).json({ message: 'Session revoked', data: session });
});
