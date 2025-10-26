import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  team: { type: String, enum: ["A", "B"], required: true },
  displayName: { type: String, required: true }
}, { _id: false });

const observerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  displayName: { type: String, required: true }
}, { _id: false });

const argumentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  team: { type: String, enum: ["A", "B"], required: true },
  message: { type: String, required: true }
}, { _id: false });

const debateSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  type: { type: String },
  maxParticipantsA: { type: Number },
  maxParticipantsB: { type: Number },
  participants: { type: [participantSchema], default: [] },
  observers: { type: [observerSchema], default: [] },
  arguments: { type: [argumentSchema], default: [] },
  status: { type: String, enum: ["active", "finished"], default: "active" },
  endedAt: { type: Date },
  winner: { type: String },
  justification: { type: String },
  score_team_a: { type: Number, default: 0 },
  score_team_b: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Debate", debateSchema);
