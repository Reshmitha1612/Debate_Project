import mongoose from "mongoose";

// Schema for individual arguments/messages within a debate
const argumentSchema = new mongoose.Schema({
  userId: String,
  team: String,
  message: String,
  // timestamp removed
});

// Main Debate Schema
const debateSchema = new mongoose.Schema({
  roomId: { type: String, unique: true },  // This is your DebateId
  topic: String,
  type: String,
  maxParticipantsA: Number,
  maxParticipantsB: Number,
  participants: [{ userId: String, name: String, team: String }],
  observers: [{ userId: String, name: String }],
  arguments: [argumentSchema],
  status: { type: String, default: "waiting" },
  aiSummary: String,
  winner: String,
  reasoning: String,
  scores: {
    teamA: Number,
    teamB: Number
  },
  endedAt: Date,
});

const Debate = mongoose.models.Debate || mongoose.model("Debate", debateSchema);
export default Debate;
