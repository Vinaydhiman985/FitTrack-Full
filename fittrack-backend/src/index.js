import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import apiRouter from "./routes/index.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

connectDB();

app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "FitTrack Backend is running!" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Socket.io ───
const connectedPlayers = new Map();

io.on("connection", (socket) => {


  socket.on("player:join", (data) => {
    const player = {
      id: socket.id,
      name: data.name || "Unknown",
      avatar: data.avatar || "blaze",
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      coins: data.coins || 0,
      xp: data.xp || 0,
      level: data.level || 1,
      lastSeen: Date.now(),
    };
    connectedPlayers.set(socket.id, player);

    const otherPlayers = Array.from(connectedPlayers.values())
      .filter(p => p.id !== socket.id);
    socket.emit("players:list", otherPlayers);
    socket.broadcast.emit("player:joined", player);


  });

  socket.on("player:location", (data) => {
    const player = connectedPlayers.get(socket.id);
    if (!player) return;
    player.latitude = data.latitude;
    player.longitude = data.longitude;
    player.lastSeen = Date.now();
    connectedPlayers.set(socket.id, player);
    socket.broadcast.emit("player:moved", {
      id: socket.id,
      latitude: data.latitude,
      longitude: data.longitude,
      heading: data.heading || 0,
      speed: data.speed || 0,
    });
  });

  socket.on("territory:claim", (data) => {
    const player = connectedPlayers.get(socket.id);
    if (!player) return;
    player.territory = (player.territory || 0) + 1;
    connectedPlayers.set(socket.id, player);
    io.emit("territory:claimed", {
      playerId: socket.id,
      playerName: player.name,
      gridKey: data.gridKey,
      color: data.color,
    });
  });

  socket.on("territory:battle", (data) => {
    const attacker = connectedPlayers.get(socket.id);
    if (!attacker) return;
    io.emit("territory:battled", {
      attackerId: socket.id,
      attackerName: attacker.name,
      defenderId: data.defenderId,
      gridKey: data.gridKey,
      winner: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const player = connectedPlayers.get(socket.id);
    if (player) {

      connectedPlayers.delete(socket.id);
      socket.broadcast.emit("player:left", { id: socket.id });
    }
  });
});

// Clean up inactive players every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [id, player] of connectedPlayers.entries()) {
    if (now - player.lastSeen > 60000) {
      connectedPlayers.delete(id);
      io.emit("player:left", { id });

    }
  }
}, 30000);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`🚀 FitTrack API listening on port ${port}`);
});
