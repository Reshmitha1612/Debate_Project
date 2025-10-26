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
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Debate Schema
const debateSchema = new mongoose.Schema({
  topic: String,
  type: String,
  participants: [
    { userId: String, name: String, role: String } // role: teamA, teamB, observer
  ],
  messages: [{ userId: String, name: String, text: String, timestamp: Date }],
  aiSummary: String,
  winner: String,
});

const Debate = mongoose.model("Debate", debateSchema);

// API to create room
app.post("/api/debates/create", async (req, res) => {
  const { topic, type } = req.body;
  const debate = new Debate({ topic, type, participants: [], messages: [] });
  await debate.save();
  res.json({ roomId: debate._id });
});

// API to end debate
app.post("/api/debates/end/:roomId", async (req, res) => {
  const { roomId } = req.params;
  const { aiSummary, winner, arguments: messages } = req.body;
  const debate = await Debate.findByIdAndUpdate(roomId, {
    aiSummary,
    winner,
    messages,
  });
  if (debate) res.json({ msg: "Debate ended" });
  else res.status(404).json({ msg: "Debate not found" });
});

// --- Socket.IO for real-time lobby and messages ---
const rooms = {}; // { roomId: { participants: [] } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join room
  socket.on("joinRoom", async ({ roomId, userId, name }) => {
    if (!rooms[roomId]) rooms[roomId] = { participants: [] };
    const room = rooms[roomId];

    // Avoid duplicate
    if (!room.participants.find((p) => p.userId === userId)) {
      room.participants.push({ userId, name, role: "" });
    }

    socket.join(roomId);
    io.to(roomId).emit("updateParticipants", room.participants);
  });

  // Choose role/team
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

  // Send message
  socket.on("sendMessage", (msg) => {
    io.to(msg.roomId).emit("receiveMessage", msg);
  });

  // Leave room
  socket.on("leaveRoom", ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.participants = room.participants.filter((p) => p.userId !== userId);
    io.to(roomId).emit("updateParticipants", room.participants);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
