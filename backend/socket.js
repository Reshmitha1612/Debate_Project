import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Import routes
import authRoutes from "./routes/Auth.js";
import debateRoutes from "./routes/debates.js";

app.use("/api/auth", authRoutes);
app.use("/api/debates", debateRoutes);

// --- Socket.IO for real-time lobby and messages (NO DB SAVING) ---
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", async ({ roomId, userId, name }) => {
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = { participants: [], messages: [] };
    }

    const room = rooms[roomId];

    if (!room.participants.find((p) => p.userId === userId)) {
      room.participants.push({ userId, name, socketId: socket.id, role: "" });
    }

    io.to(roomId).emit("updateParticipants", room.participants);
    console.log(`${name} joined room ${roomId}`);
  });

  socket.on("chooseRole", ({ roomId, userId, role }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const participant = room.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.role = role;
      io.to(roomId).emit("updateParticipants", room.participants);
      console.log(`${participant.name} chose role: ${role}`);
    }
  });

  socket.on("startDebate", ({ roomId }) => {
    io.to(roomId).emit("debateStarted");
    console.log(`Debate started in room ${roomId}`);
  });

  // 🔥 MODIFIED: Only broadcast message, DON'T save to DB
  socket.on("sendMessage", (msg) => {
    const { roomId, name, text } = msg;
    
    // Save to in-memory only
    if (!rooms[roomId]) {
      rooms[roomId] = { participants: [], messages: [] };
    }
    rooms[roomId].messages.push(msg);

    // Broadcast to all users
    io.to(roomId).emit("receiveMessage", msg);
    console.log(`💬 Message from ${name}: "${text}"`);
  });

  socket.on("endDebate", async ({ roomId, result }) => {
    console.log(`📢 Broadcasting debate end to room ${roomId}`);
    io.to(roomId).emit("debateEnded", result);
    
    if (rooms[roomId]) {
      delete rooms[roomId];
      console.log(`🧹 Room ${roomId} cleaned up`);
    }
  });

  socket.on("leaveRoom", ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room) {
      room.participants = room.participants.filter((p) => p.userId !== userId);
      io.to(roomId).emit("updateParticipants", room.participants);
      console.log(`User ${userId} left room ${roomId}`);
    }
    socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    Object.keys(rooms).forEach((roomId) => {
      const room = rooms[roomId];
      const disconnectedUser = room.participants.find(p => p.socketId === socket.id);
      
      if (disconnectedUser) {
        room.participants = room.participants.filter(p => p.socketId !== socket.id);
        io.to(roomId).emit("updateParticipants", room.participants);
        console.log(`${disconnectedUser.name} disconnected from room ${roomId}`);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
