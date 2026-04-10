import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import config from './config/env.js';
import Territory from './models/territory.model.js';

const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: config.clientOrigin === '*' ? '*' : config.clientOrigin.split(','),
    methods: ['GET', 'POST'],
  },
});

// Socket.io Logic
const connectedPlayers = new Map();
const PLAYER_TTL_MS = 60_000;

io.on('connection', (socket) => {
  console.log(`[io] Player connected: ${socket.id}`);

  socket.on('player:join', (payload = {}) => {
    const player = {
      id: socket.id,
      userId: payload.userId || null,
      name: payload.name || 'Player',
      avatar: payload.avatar || 'blaze',
      latitude: payload.latitude || 0,
      longitude: payload.longitude || 0,
      coins: payload.coins || 0,
      xp: payload.xp || 0,
      level: payload.level || 1,
      lastSeen: Date.now(),
    };

    connectedPlayers.set(socket.id, player);

    // Send existing players to the new player
    const otherPlayers = Array.from(connectedPlayers.values()).filter(p => p.id !== socket.id);
    socket.emit('players:list', otherPlayers);

    // Notify others
    socket.broadcast.emit('player:joined', player);
  });

  socket.on('player:location', (payload = {}) => {
    const player = connectedPlayers.get(socket.id);
    if (!player) return;

    player.latitude = payload.latitude || 0;
    player.longitude = payload.longitude || 0;
    player.lastSeen = Date.now();
    
    connectedPlayers.set(socket.id, player);

    socket.broadcast.emit('player:moved', {
      id: socket.id,
      latitude: player.latitude,
      longitude: player.longitude,
      heading: payload.heading || 0,
      speed: payload.speed || 0,
    });
  });

  socket.on('territory:claim', async (payload = {}) => {
    const player = connectedPlayers.get(socket.id);
    if (!player || !payload.gridKey || !player.userId) return;

    try {
      await Territory.findOneAndUpdate(
        { gridKey: payload.gridKey },
        {
          owner: player.userId,
          color: payload.color || '#00bcd4',
          latitude: payload.latitude,
          longitude: payload.longitude,
          claimedAt: Date.now(),
        },
        { upsert: true, new: true }
      );

      io.emit('territory:claimed', {
        playerId: socket.id,
        playerName: player.name,
        gridKey: payload.gridKey,
        color: payload.color || '#00bcd4',
      });
    } catch (err) {
      console.error('[io] territory:claim error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    connectedPlayers.delete(socket.id);
    socket.broadcast.emit('player:left', { id: socket.id });
    console.log(`[io] Player disconnected: ${socket.id}`);
  });
});

// Cleanup inactive players
setInterval(() => {
  const now = Date.now();
  for (const [id, player] of connectedPlayers.entries()) {
    if (now - player.lastSeen > PLAYER_TTL_MS) {
      connectedPlayers.delete(id);
      io.emit('player:left', { id });
    }
  }
}, 30_000);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    const port = config.port;
    server.listen(port, '0.0.0.0', () => {
      console.log(`[server] FitTrack Backend running on port ${port}`);
    });
  } catch (error) {
    console.error('[server] Initialization failed:', error.message);
    process.exit(1);
  }
};

startServer();
