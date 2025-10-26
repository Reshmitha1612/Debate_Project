import express from "express";
import Debate from "../models/Debate.js";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create debate room - CREATOR AUTOMATICALLY ADDED
router.post("/create", authMiddleware, async (req, res) => {
  try {
    console.log("📥 Create request body:", req.body);
    console.log("👤 User:", req.user);
    
    const { topic, type, maxParticipantsA, maxParticipantsB } = req.body;

    if (!topic || topic.trim() === "") {
      return res.status(400).json({ msg: "Topic is required" });
    }

    if (topic.trim().length < 5) {
      return res.status(400).json({ msg: "Topic must be at least 5 characters" });
    }

    const roomId = uuidv4();
    console.log("🆔 Generated roomId:", roomId);

    // ✅ CREATOR IS AUTOMATICALLY ADDED TO PARTICIPANTS
    const debate = new Debate({
      roomId,
      topic: topic.trim(),
      type: type || "team",
      maxParticipantsA: maxParticipantsA || 4,
      maxParticipantsB: maxParticipantsB || 4,
      participants: [{
        userId: req.userId,
        displayName: req.user.name || "Creator",
        team: "A" // Creator defaults to Team A
      }],
      observers: [],
      status: "waiting",
      arguments: [],
    });

    console.log("💾 Attempting to save debate...");
    await debate.save();
    console.log("✅ Debate saved with creator as participant:", req.user.name);

    res.json({
      msg: "Debate room created successfully",
      roomId,
      topic: debate.topic,
      type: debate.type,
      participantsCount: debate.participants.length
    });
  } catch (err) {
    console.error("❌ Error in /create:", err);
    res.status(500).json({ 
      msg: "Error creating debate room", 
      error: err.message 
    });
  }
});

// Join as participant
router.post("/join/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const { team, displayName } = req.body;

  try {
    const debate = await Debate.findOne({ roomId });

    if (!debate) {
      return res.status(404).json({ msg: "Room not found" });
    }

    if (debate.status === "finished") {
      return res.status(400).json({ msg: "This debate has ended" });
    }

    // Check if already participant
    if (debate.participants.some(p => p.userId === req.userId)) {
      return res.status(400).json({ msg: "Already joined as participant" });
    }

    // Check if already observer
    if (debate.observers.some(o => o.userId === req.userId)) {
      // Remove from observers first
      debate.observers = debate.observers.filter(o => o.userId !== req.userId);
    }

    // Validate team
    const validTeam = team === "A" || team === "B" ? team : "A";

    debate.participants.push({
      userId: req.userId,
      displayName: displayName || req.user.name || "Participant",
      team: validTeam
    });

    await debate.save();
    
    console.log(`✅ ${req.user.name} joined as participant in team ${validTeam}`);
    
    res.json({ 
      msg: "Joined as participant", 
      participants: debate.participants,
      team: validTeam
    });
  } catch (err) {
    console.error("Error in /join:", err);
    res.status(500).json({ msg: "Error joining debate", error: err.message });
  }
});

// Join as observer
router.post("/observe/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const { displayName } = req.body;

  try {
    const debate = await Debate.findOne({ roomId });

    if (!debate) {
      return res.status(404).json({ msg: "Room not found" });
    }

    // Check if already participant
    if (debate.participants.some(p => p.userId === req.userId)) {
      return res.status(400).json({ msg: "Already joined as participant" });
    }

    // Check if already observer
    if (debate.observers.some(o => o.userId === req.userId)) {
      return res.status(400).json({ msg: "Already observing this debate" });
    }

    debate.observers.push({
      userId: req.userId,
      displayName: displayName || req.user.name || "Observer"
    });

    await debate.save();
    
    console.log(`✅ ${req.user.name} joined as observer`);
    
    res.json({ 
      msg: "Joined as observer", 
      observers: debate.observers 
    });
  } catch (err) {
    console.error("Error in /observe:", err);
    res.status(500).json({ msg: "Error observing debate", error: err.message });
  }
});

// Get room information
router.get("/room/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;

  try {
    const debate = await Debate.findOne({ roomId });

    if (!debate) {
      return res.status(404).json({ msg: "Room not found" });
    }

    console.log(`📊 Room ${roomId} info requested by ${req.user.name}`);
    console.log(`👥 Participants: ${debate.participants.length}, Observers: ${debate.observers.length}`);

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

// End debate
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

    // Check if user is participant (only participants can end debate)
    const isParticipant = debate.participants.some(p => p.userId === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ msg: "Only participants can end the debate" });
    }

    debate.status = "finished";
    debate.endedAt = new Date();

    // Save arguments from frontend
    if (Array.isArray(args) && args.length > 0) {
      const validArguments = args
        .map(arg => ({
          userId: String(arg.userId || ""),
          team: String(arg.team || ""),
          message: String(arg.message || "").trim()
        }))
        .filter(arg => arg.userId && arg.team && arg.message);

      debate.arguments = validArguments;
    }

    await debate.save();
    console.log(`✅ Debate ${roomId} ended by ${req.user.name} with ${debate.arguments.length} arguments`);

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

// Get debate details
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

    console.log(`📖 Debate details accessed by ${req.user.name}`);

    res.json(debate);
  } catch (err) {
    console.error("Error in /details:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// AI Analysis
router.post("/analyze/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;

  try {
    const debate = await Debate.findOne({ roomId });
    if (!debate) {
      return res.status(404).json({ msg: "Room not found" });
    }

    // Check if user participated
    const participated = debate.participants.some(p => p.userId === req.userId);
    const observed = debate.observers.some(o => o.userId === req.userId);
    
    if (!participated && !observed) {
      return res.status(403).json({ msg: "You did not participate in this debate" });
    }

    const isRetry = 
      debate.winner && 
      (debate.winner === "Analysis failed" || 
       debate.winner === "Analysis pending");

    if (isRetry) {
      console.log(`🔄 Retrying AI analysis for debate ${roomId} by ${req.user.name}`);
    } else {
      console.log(`🤖 Starting AI analysis for debate ${roomId} by ${req.user.name}`);
    }

    // Validation
    if (!debate.topic || !debate.topic.trim()) {
      return res.status(400).json({ msg: "Debate topic missing" });
    }

    if (!Array.isArray(debate.arguments) || debate.arguments.length === 0) {
      return res.status(400).json({ msg: "No arguments found for analysis" });
    }

    // Format arguments for AI
    const formattedArguments = debate.arguments
      .map((arg) => ({
        userId: String(arg.userId || ""),
        team: String(arg.team || ""),
        message: String(arg.message || "").trim()
      }))
      .filter(arg => arg.userId && arg.team && arg.message);

    if (formattedArguments.length === 0) {
      return res.status(400).json({ msg: "No valid arguments for analysis" });
    }

    // Check AI API URL
    if (!process.env.AI_API_URL || process.env.AI_API_URL === "https://your-ai-service-url.com/analyze") {
      console.log("⚠️ AI API URL not configured properly");
      
      // Save mock analysis result
      debate.winner = "Analysis pending";
      debate.justification = "AI analysis service is not configured. Please set AI_API_URL in your .env file.";
      debate.score_team_a = 0;
      debate.score_team_b = 0;
      await debate.save();
      
      return res.status(503).json({
        msg: "AI service not configured",
        result: {
          winner: "Analysis pending",
          justification: "AI analysis service is not configured. Please set AI_API_URL in your .env file.",
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

    console.log("📤 Calling AI API:", process.env.AI_API_URL);
    console.log(`📦 Arguments count: ${formattedArguments.length}`);

    // Call AI service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const aiResponse = await fetch(process.env.AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`❌ AI API error ${aiResponse.status}:`, errorText);
      throw new Error(`AI API returned status ${aiResponse.status}: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    console.log("📥 AI Response received successfully");
    
    // Save AI results
    debate.winner = aiResult.winner || "No winner determined";
    debate.justification = aiResult.justification || "No justification provided";
    debate.score_team_a = Number(aiResult.score_team_a) || 0;
    debate.score_team_b = Number(aiResult.score_team_b) || 0;
    await debate.save();

    console.log(`✅ AI analysis complete - Winner: ${debate.winner}`);

    res.json({
      msg: isRetry ? "AI re-analysis complete" : "AI analysis complete",
      result: {
        winner: debate.winner,
        justification: debate.justification,
        score_team_a: debate.score_team_a,
        score_team_b: debate.score_team_b,
      },
    });
  } catch (err) {
    console.error("❌ Error in /analyze:", err);
    
    // Save failure to database
    try {
      const debate = await Debate.findOne({ roomId });
      if (debate) {
        debate.winner = "Analysis failed";
        debate.justification = `Analysis error: ${err.message}`;
        debate.score_team_a = 0;
        debate.score_team_b = 0;
        await debate.save();
      }
    } catch (saveErr) {
      console.error("❌ Error saving failure state:", saveErr);
    }
    
    // Return 200 so debate is still accessible
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

// Get debate history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const debates = await Debate.find({
      $or: [
        { "participants.userId": req.userId },
        { "observers.userId": req.userId },
      ],
      status: "finished",
    }).sort({ endedAt: -1 });

    console.log(`📚 ${req.user.name} requested history: ${debates.length} debates found`);

    res.json(debates);
  } catch (err) {
    console.error("Error in /history:", err);
    res.status(500).json({ msg: "Error fetching history", error: err.message });
  }
});

export default router;
