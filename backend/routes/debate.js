import express from "express";
import Debate from "../models/Debate.js";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Create debate room with creator as participant
router.post("/create", authMiddleware, async (req, res) => {
  const { topic, type, maxParticipantsA, maxParticipantsB, team } = req.body;

  if (!topic || topic.trim() === "") {
    return res.status(400).json({ msg: "Topic is required" });
  }

  const roomId = uuidv4();

  const debate = new Debate({
    roomId,
    topic,
    type,
    maxParticipantsA,
    maxParticipantsB,
    participants: [{
      userId: req.userId,
      team: team || "A",
      displayName: req.user?.displayName || "Creator"
    }],
    observers: [],
  });

  await debate.save();

  res.json({
    msg: "Debate room created successfully",
    roomId,
    topic,
    creator: req.user?.displayName || "Creator"
  });
});

// ✅ Join as participant
router.post("/join/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const { team, displayName } = req.body;

  try {
    const debate = await Debate.findOne({ roomId });

    if (!debate) {
      return res.status(404).json({ msg: "Room not found" });
    }

    if (debate.participants.some(p => p.userId === req.userId)) {
      return res.status(400).json({ msg: "Already joined as participant" });
    }

    debate.participants.push({
      userId: req.userId,
      team,
      displayName
    });

    await debate.save();
    res.json({ msg: "Joined as participant", participants: debate.participants });
  } catch (err) {
    res.status(500).json({ msg: "Error joining debate", error: err.message });
  }
});

// ✅ Join as observer
router.post("/observe/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const { displayName } = req.body;

  try {
    const debate = await Debate.findOne({ roomId });

    if (!debate) {
      return res.status(404).json({ msg: "Room not found" });
    }

    if (debate.observers.some(o => o.userId === req.userId)) {
      return res.status(400).json({ msg: "Already observing this debate" });
    }

    debate.observers.push({
      userId: req.userId,
      displayName
    });

    await debate.save();
    res.json({ msg: "Joined as observer", observers: debate.observers });
  } catch (err) {
    res.status(500).json({ msg: "Error observing debate", error: err.message });
  }
});

// ✅ Get room information (for joining)
router.get("/room/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;

  try {
    const debate = await Debate.findOne({ roomId });

    if (!debate) {
      return res.status(404).json({ msg: "Room not found" });
    }

    res.json({
      roomId: debate.roomId,
      topic: debate.topic,
      type: debate.type,
      status: debate.status,
      participants: debate.participants,
      observers: debate.observers,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ END DEBATE - Save arguments to database
router.post("/end/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const args = req.body.arguments;

  try {
    const debate = await Debate.findOne({ roomId });

    if (!debate) {
      return res.status(404).json({ msg: "Room not found" });
    }

    debate.status = "finished";
    debate.arguments = args || [];
    debate.endedAt = new Date();

    await debate.save();

    res.json({
      msg: "Debate ended successfully",
      debate: {
        roomId: debate.roomId,
        topic: debate.topic,
        status: debate.status,
        arguments: debate.arguments,
      },
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error ending debate",
      error: err.message
    });
  }
});

// ✅ Get specific debate details by roomId
router.get("/details/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;

  try {
    const debate = await Debate.findOne({ roomId });

    if (!debate) {
      return res.status(404).json({ msg: "Debate not found" });
    }

    const participated = debate.participants.some(p => p.userId === req.userId);
    const observed = debate.observers.some(o => o.userId === req.userId);

    if (!participated && !observed) {
      return res.status(403).json({ msg: "You did not participate in this debate" });
    }

    res.json(debate);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ AI Analysis - UPDATED to remove timestamp and add DebateId
router.post("/analyze/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;

  try {
    const debate = await Debate.findOne({ roomId });
    if (!debate) return res.status(404).json({ msg: "Room not found" });

    const formattedArguments = debate.arguments.map((arg) => ({
      userId: arg.userId,
      team: arg.team,
      message: arg.message,
    }));

    if (!process.env.AI_API_URL) {
      return res.status(503).json({
        msg: "AI service not configured",
        result: {
          winner: "Analysis pending",
          aiSummary: "AI analysis service is not available.",
          reasoning: "",
          scores: { teamA: 0, teamB: 0 }
        }
      });
    }

    const aiResponse = await fetch(process.env.AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: debate.topic,
        DebateId: roomId,
        arguments: formattedArguments,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API returned status ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();

    debate.aiSummary = aiResult.aiSummary;
    debate.winner = aiResult.winner;
    debate.reasoning = aiResult.reasoning;
    debate.scores = aiResult.scores;
    await debate.save();

    res.json({
      msg: "AI analysis complete",
      result: {
        aiSummary: aiResult.aiSummary,
        winner: aiResult.winner,
        reasoning: aiResult.reasoning,
        scores: aiResult.scores,
      },
    });
  } catch (err) {
    res.status(200).json({
      msg: "AI analysis failed but debate saved",
      result: {
        winner: "Analysis failed",
        aiSummary: "AI analysis encountered an error. Your debate has been saved.",
        reasoning: `Error: ${err.message}`,
        scores: { teamA: 0, teamB: 0 }
      }
    });
  }
});

// ✅ Get user debate history
router.get("/history", authMiddleware, async (req, res) => {
  const debates = await Debate.find({
    $or: [
      { "participants.userId": req.userId },
      { "observers.userId": req.userId },
    ],
    status: "finished",
  });
  res.json(debates);
});

export default router;
