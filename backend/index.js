import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/Auth.js";
import debateRoutes from "./routes/debate.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Routes
app.use("/api", authRoutes);
app.use("/api/debates", debateRoutes);

// --- Socket.IO real-time events ---
const rooms = {}; // in-memory room tracking: { roomId: { participants: [] } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room
  socket.on("joinRoom", ({ roomId, userId, name }) => {
    if (!rooms[roomId]) rooms[roomId] = { participants: [] };
    const room = rooms[roomId];

    // Avoid duplicate entries
    if (!room.participants.find((p) => p.userId === userId)) {
      room.participants.push({ userId, name, role: "" });
    }

    socket.join(roomId);
    io.to(roomId).emit("updateParticipants", room.participants);
  });

  // Choose a team or observer role
  socket.on("chooseRole", ({ roomId, userId, role }) => {
    const room = rooms[roomId];
    if (!room) return;
    const participant = room.participants.find((p) => p.userId === userId);
    if (participant) participant.role = role;
    io.to(roomId).emit("updateParticipants", room.participants);
  });

  // Start debate
  socket.on("startDebate", ({ roomId }) => {
    io.to(roomId).emit("debateStarted");
  });

  // Send and broadcast messages
  socket.on("sendMessage", (msg) => {
    io.to(msg.roomId).emit("receiveMessage", msg);
  });

  // Handle leaving the room
  socket.on("leaveRoom", ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.participants = room.participants.filter((p) => p.userId !== userId);
    io.to(roomId).emit("updateParticipants", room.participants);
  });

  // Handle disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
