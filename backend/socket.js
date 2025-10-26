import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Import models and routes
import Debate from "./models/Debate.js";
import User from "./models/User.js";
import authRoutes from "./routes/Auth.js";
import debateRoutes from "./routes/debates.js";

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/debates", debateRoutes);

// Socket.IO with improved error handling
const activeSockets = {};

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("joinRoom", async ({ roomId, userId, name }) => {
    try {
      socket.join(roomId);
      
      if (!activeSockets[roomId]) {
        activeSockets[roomId] = [];
      }
      
      // Remove existing socket for same user
      activeSockets[roomId] = activeSockets[roomId].filter(s => s.userId !== userId);
      activeSockets[roomId].push({ userId, socketId: socket.id, name });

      const debate = await Debate.findOne({ roomId });
      
      if (!debate) {
        socket.emit("error", { msg: "Debate room not found" });
        return;
      }

      // Check if user already in participants
      const existsInDb = debate.participants.some(p => p.userId === userId);
      
      if (!existsInDb) {
        // Add to participants if not already there
        debate.participants.push({
          userId,
          displayName: name,
          team: "A" // Default team
        });
        await debate.save();
        console.log(`💾 ${name} added to debate ${roomId} via socket`);
      } else {
        console.log(`✓ ${name} already in participants for debate ${roomId}`);
      }

      // Emit room info
      io.to(roomId).emit("roomInfo", {
        type: debate.type,
        topic: debate.topic,
        participants: debate.participants,
        observers: debate.observers,
        status: debate.status
      });

      io.to(roomId).emit("updateParticipants", debate.participants);
      
      console.log(`👥 ${name} joined room ${roomId} (${activeSockets[roomId].length} active)`);
    } catch (err) {
      console.error("❌ Error in joinRoom:", err);
      socket.emit("error", { msg: "Failed to join room" });
    }
  });

  socket.on("chooseRole", async ({ roomId, userId, role }) => {
    try {
      const debate = await Debate.findOne({ roomId });
      
      if (!debate) {
        socket.emit("error", { msg: "Debate room not found" });
        return;
      }
      
      const participant = debate.participants.find(p => p.userId === userId);
      
      if (participant) {
        // Normalize team values
        let normalizedTeam = role;
        if (role === "teamA") normalizedTeam = "A";
        else if (role === "teamB") normalizedTeam = "B";
        else if (role === "observer") {
          // Move to observers
          debate.observers.push({
            userId: participant.userId,
            displayName: participant.displayName
          });
          debate.participants = debate.participants.filter(p => p.userId !== userId);
          await debate.save();
          
          console.log(`✅ ${participant.displayName} became observer`);
          io.to(roomId).emit("updateParticipants", debate.participants);
          io.to(roomId).emit("updateObservers", debate.observers);
          return;
        }
        
        participant.team = normalizedTeam;
        await debate.save();
        
        console.log(`✅ ${participant.displayName} chose team: ${normalizedTeam}`);
        io.to(roomId).emit("updateParticipants", debate.participants);
      } else {
        console.error(`❌ Participant ${userId} not found in debate ${roomId}`);
      }
    } catch (err) {
      console.error("❌ Error in chooseRole:", err);
      socket.emit("error", { msg: "Failed to choose role" });
    }
  });

  socket.on("startDebate", ({ roomId }) => {
    try {
      io.to(roomId).emit("debateStarted");
      console.log(`🎬 Debate started in room ${roomId}`);
    } catch (err) {
      console.error("❌ Error starting debate:", err);
    }
  });

  socket.on("sendMessage", (msg) => {
    try {
      const { roomId, name, text, role, userId } = msg;
      
      if (!roomId || !text || !text.trim()) {
        return;
      }

      const messageData = {
        ...msg,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random()
      };

      io.to(roomId).emit("receiveMessage", messageData);
      console.log(`💬 [${roomId}] ${name} (${role}): "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  });

  socket.on("endDebate", async ({ roomId, result }) => {
    try {
      console.log(`📢 Broadcasting debate end to room ${roomId}`);
      io.to(roomId).emit("debateEnded", result);
      
      // Clean up active sockets for this room
      if (activeSockets[roomId]) {
        delete activeSockets[roomId];
        console.log(`🧹 Room ${roomId} cleaned up`);
      }
    } catch (err) {
      console.error("❌ Error ending debate:", err);
    }
  });

  socket.on("leaveRoom", ({ roomId, userId }) => {
    try {
      if (activeSockets[roomId]) {
        activeSockets[roomId] = activeSockets[roomId].filter(s => s.userId !== userId);
        console.log(`👋 User ${userId} left room ${roomId}`);
      }
      socket.leave(roomId);
    } catch (err) {
      console.error("❌ Error leaving room:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    
    // Clean up from all rooms
    try {
      Object.keys(activeSockets).forEach((roomId) => {
        const disconnectedUser = activeSockets[roomId]?.find(s => s.socketId === socket.id);
        
        if (disconnectedUser) {
          activeSockets[roomId] = activeSockets[roomId].filter(s => s.socketId !== socket.id);
          console.log(`👋 ${disconnectedUser.name} disconnected from room ${roomId}`);
        }
      });
    } catch (err) {
      console.error("❌ Error in disconnect cleanup:", err);
    }
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled`);
  console.log(`🌐 CORS enabled for http://localhost:3000`);
});
