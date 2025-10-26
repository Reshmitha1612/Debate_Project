import express from "express";
import Debate from "../models/Debate.js";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, async (req, res) => {
  try {
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
      status: "active",
      arguments: [],
    });

    await debate.save();

    res.json({
      msg: "Debate room created successfully",
      roomId,
      topic,
      creator: req.user?.displayName || "Creator"
    });
  } catch (err) {
    console.error("Error in /create:", err);
    res.status(500).json({ msg: "Error creating debate room", error: err.message });
  }
});

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
      displayName: displayName || req.user?.displayName || "Participant"
    });

    await debate.save();
    res.json({ msg: "Joined as participant", participants: debate.participants });
  } catch (err) {
    console.error("Error in /join:", err);
    res.status(500).json({ msg: "Error joining debate", error: err.message });
  }
});

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
      displayName: displayName || req.user?.displayName || "Observer"
    });

    await debate.save();
    res.json({ msg: "Joined as observer", observers: debate.observers });
  } catch (err) {
    console.error("Error in /observe:", err);
    res.status(500).json({ msg: "Error observing debate", error: err.message });
  }
});

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
    console.error("Error in /room:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// 🔥 MODIFIED: Accept arguments when ending debate
router.post("/end/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const { arguments: args } = req.body;

  try {
    const debate = await Debate.findOne({ roomId });

    if (!debate) {
      return res.status(404).json({ msg: "Room not found" });
    }

    if (debate.status === "finished") {
      return res.status(400).json({ msg: "Debate already ended" });
    }

    debate.status = "finished";
    debate.endedAt = new Date();

    // 🔥 Save arguments sent from frontend
    if (Array.isArray(args) && args.length > 0) {
      debate.arguments = args.map(arg => ({
        userId: String(arg.userId || ""),
        team: String(arg.team || ""),
        message: String(arg.message || "")
      })).filter(arg => arg.userId && arg.team && arg.message);
    }

    await debate.save();

    console.log(`✅ Debate ${roomId} ended with ${debate.arguments.length} arguments`);

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
    console.error("Error in /end:", err);
    res.status(500).json({
      msg: "Server error ending debate",
      error: err.message
    });
  }
});

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
    console.error("Error in /details:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.post("/analyze/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;

  try {
    const debate = await Debate.findOne({ roomId });
    if (!debate) {
      return res.status(404).json({ msg: "Room not found" });
    }

    const isRetry = 
      debate.winner && 
      (debate.winner === "Analysis failed" || 
       debate.winner === "Analysis pending" || 
       debate.justification?.includes("Error:") ||
       debate.justification === "AI analysis unavailable");

    if (isRetry) {
      console.log(`🔄 Retrying AI analysis for debate ${roomId}`);
    }

    if (!debate.topic || typeof debate.topic !== "string" || !debate.topic.trim()) {
      return res.status(400).json({ msg: "Debate topic missing or invalid" });
    }

    if (!Array.isArray(debate.arguments) || debate.arguments.length === 0) {
      return res.status(400).json({ msg: "No arguments found for analysis" });
    }

    const formattedArguments = debate.arguments
      .map((arg) => ({
        userId: String(arg.userId || ""),
        team: String(arg.team || ""),
        message: String(arg.message || "")
      }))
      .filter(arg => arg.userId && arg.team && arg.message);

    if (formattedArguments.length === 0) {
      return res.status(400).json({ msg: "No valid arguments for analysis" });
    }

    if (!process.env.AI_API_URL) {
      return res.status(503).json({
        msg: "AI service not configured",
        result: {
          winner: "Analysis pending",
          justification: "AI analysis service is not available.",
          score_team_a: 0,
          score_team_b: 0
        }
      });
    }

    const payload = {
      DebateId: String(roomId),
      topic: String(debate.topic),
      arguments: formattedArguments
    };

    console.log("📤 Sending to AI API:", JSON.stringify(payload, null, 2));

    const aiResponse = await fetch(process.env.AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`❌ AI API error ${aiResponse.status}:`, errorText);
      throw new Error(`AI API returned status ${aiResponse.status}: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    console.log("📥 AI API Response:", aiResult);
    
    debate.winner = aiResult.winner || "";
    debate.justification = aiResult.justification || "";
    debate.score_team_a = aiResult.score_team_a || 0;
    debate.score_team_b = aiResult.score_team_b || 0;
    await debate.save();

    console.log(isRetry ? `✅ AI re-analysis complete` : `✅ AI analysis complete`);

    res.json({
      msg: isRetry ? "AI re-analysis complete" : "AI analysis complete",
      result: {
        winner: aiResult.winner,
        justification: aiResult.justification,
        score_team_a: aiResult.score_team_a,
        score_team_b: aiResult.score_team_b,
      },
    });
  } catch (err) {
    console.error("❌ Error in /analyze:", err);
    res.status(200).json({
      msg: "AI analysis failed but debate saved",
      result: {
        winner: "Analysis failed",
        justification: `Error: ${err.message}`,
        score_team_a: 0,
        score_team_b: 0
      }
    });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const debates = await Debate.find({
      $or: [
        { "participants.userId": req.userId },
        { "observers.userId": req.userId },
      ],
      status: "finished",
    }).sort({ endedAt: -1 });

    res.json(debates);
  } catch (err) {
    console.error("Error in /history:", err);
    res.status(500).json({ msg: "Error fetching debate history", error: err.message });
  }
});

export default router;
