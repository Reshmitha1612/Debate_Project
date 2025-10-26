import mongoose from "mongoose";

const argumentSchema = new mongoose.Schema({
  userId: String,
  team: String,
  message: String,
});

const debateSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  topic: { type: String, required: true },
  type: { type: String, default: "team" },
  maxParticipantsA: { type: Number, default: 4 },
  maxParticipantsB: { type: Number, default: 4 },
  participants: [{ 
    userId: String, 
    displayName: String, 
    team: String 
  }],
  observers: [{ 
    userId: String, 
    displayName: String 
  }],
  arguments: [argumentSchema],
  status: { type: String, default: "waiting" },
  winner: String,
  justification: String,
  score_team_a: Number,
  score_team_b: Number,
  endedAt: Date,
}, { timestamps: true });

const Debate = mongoose.model("Debate", debateSchema);
export default Debate;
