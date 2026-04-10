import express from 'express';
import cors from 'cors';
import path from 'path';
import config from './config/env.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import stepsRoutes from './routes/steps.routes.js';
import shopRoutes from './routes/shop.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import territoryRoutes from './routes/territory.routes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: config.clientOrigin === '*' ? '*' : config.clientOrigin.split(','),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/static', express.static(path.join(process.cwd(), 'public')));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'FitTrack API is running' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/steps', stepsRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/territory', territoryRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
