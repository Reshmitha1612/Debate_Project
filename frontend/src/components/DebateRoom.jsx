import { useState, useEffect, useRef, useContext } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import axios from "../services/api";

const socket = io("http://localhost:5000", { withCredentials: true });

export default function DebateRoom() {
  const { roomId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [participants, setParticipants] = useState([]);
  const [role, setRole] = useState("");
  const [debateStarted, setDebateStarted] = useState(false);
  const [debateEnded, setDebateEnded] = useState(false);
  const [type, setType] = useState("");
  const [topic, setTopic] = useState("");
  const [debateResult, setDebateResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const response = await axios.get(`/debates/room/${roomId}`);
        setTopic(response.data.topic);
        setType(response.data.type);
        setParticipants(response.data.participants || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching room info:", err);
        alert("Failed to load room information");
        navigate("/dashboard");
      }
    };

    if (roomId && user) {
      fetchRoomInfo();
    }
  }, [roomId, user, navigate]);

  useEffect(() => {
    if (!user) return;

    socket.emit("joinRoom", { roomId, userId: user._id, name: user.name });

    socket.on("roomInfo", (data) => {
      setType(data.type);
      setTopic(data.topic);
      setParticipants(data.participants || []);
      setLoading(false);
    });

    socket.on("updateParticipants", (data) => setParticipants(data));
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));

    socket.on("debateStarted", () => {
      setDebateStarted(true);
    });

    socket.on("debateEnded", (result) => {
      setDebateEnded(true);
      setDebateResult(result);
    });

    return () => {
      socket.off("roomInfo");
      socket.off("updateParticipants");
      socket.off("receiveMessage");
      socket.off("debateStarted");
      socket.off("debateEnded");
      socket.emit("leaveRoom", { roomId, userId: user._id });
    };
  }, [roomId, user]);

  const chooseRole = (selectedRole) => {
    setRole(selectedRole);
    socket.emit("chooseRole", { roomId, userId: user._id, role: selectedRole });
  };

  const sendMessage = () => {
    if (!input.trim() || debateEnded) return;
    const msg = {
      roomId,
      userId: user._id,
      name: user.name,
      text: input,
      role: role,
    };
    socket.emit("sendMessage", msg);
    setInput("");
  };

  // 🔥 MODIFIED: Send all messages when finishing debate
  const finishDebate = async () => {
    if (!window.confirm("Finish debate for everyone?")) return;

    try {
      console.log("=== Starting debate end process ===");
      console.log("DebateId (roomId):", roomId);
      console.log("Total messages:", messages.length);

      // 🔥 Format all messages as arguments
      const formattedArguments = messages
        .filter(msg => msg.role !== "observer")
        .map(msg => {
          let normalizedTeam = msg.role;
          if (msg.role === "teamA") normalizedTeam = "A";
          else if (msg.role === "teamB") normalizedTeam = "B";

          return {
            userId: msg.userId,
            team: normalizedTeam,
            message: msg.text,
          };
        });

      console.log("Formatted arguments:", formattedArguments);

      if (formattedArguments.length === 0) {
        alert("No arguments to analyze. Please add some debate messages first.");
        return;
      }

      // 🔥 Send arguments to backend when ending debate
      const endResponse = await fetch(
        `http://localhost:5000/api/debates/end/${roomId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            arguments: formattedArguments,
          }),
        }
      );

      console.log("End response status:", endResponse.status);

      if (!endResponse.ok) {
        const errorData = await endResponse.json();
        console.error("End debate error response:", errorData);
        throw new Error(errorData.msg || `Failed to end debate: ${endResponse.status}`);
      }

      const endResult = await endResponse.json();
      console.log("Debate ended successfully:", endResult);
      console.log("Total arguments saved:", endResult.debate?.arguments?.length || 0);

      // AI Analysis
      let aiResult = null;
      let aiAnalysisFailed = false;

      try {
        console.log("Calling AI analysis API...");
        const analyzeResponse = await fetch(
          `http://localhost:5000/api/debates/analyze/${roomId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (analyzeResponse.ok) {
          aiResult = await analyzeResponse.json();
          console.log("AI analysis successful:", aiResult);
        } else {
          const errorData = await analyzeResponse.json();
          console.warn("AI analysis failed:", errorData);
          aiAnalysisFailed = true;
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
        aiAnalysisFailed = true;
      }

      const finalResult = {
        winner: aiResult?.result?.winner || "Analysis pending",
        justification:
          aiResult?.result?.justification ||
          (aiAnalysisFailed ? "AI analysis unavailable" : "Debate ended. Thank you for participating!"),
        score_team_a: aiResult?.result?.score_team_a || 0,
        score_team_b: aiResult?.result?.score_team_b || 0,
        totalArguments: formattedArguments.length,
        aiAnalysisFailed,
      };

      console.log("Final result:", finalResult);

      socket.emit("endDebate", {
        roomId,
        result: finalResult,
      });

      setDebateEnded(true);
      setDebateResult(finalResult);

      if (aiAnalysisFailed) {
        alert("Debate ended successfully! AI analysis unavailable.");
      }
    } catch (err) {
      console.error("Error ending debate:", err);
      alert("Error ending debate: " + err.message);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="pt-24 flex items-center justify-center h-[80vh]">
        <p className="text-xl">Loading debate room...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 max-w-3xl mx-auto h-[80vh] flex flex-col">
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-blue-600">{topic || "Debate Room"}</span>
        </h1>
        <p className="text-gray-600">
          Type: <strong>{type === "team" ? "Team (4v4)" : "1v1"}</strong> | DebateId:{" "}
          <span className="font-mono text-sm">{roomId.slice(0, 8)}...</span>
        </p>
      </div>

      {!debateStarted ? (
        <div className="border rounded p-4 flex flex-col gap-4 bg-gray-50">
          <h2 className="text-xl font-bold">Lobby</h2>
          <p>Choose your team or join as observer:</p>
          <div className="flex gap-2">
            <button
              onClick={() => chooseRole("teamA")}
              className={`px-4 py-2 rounded ${
                role === "teamA" ? "bg-blue-600 text-white" : "bg-gray-300"
              }`}
            >
              Team A
            </button>
            <button
              onClick={() => chooseRole("teamB")}
              className={`px-4 py-2 rounded ${
                role === "teamB" ? "bg-red-600 text-white" : "bg-gray-300"
              }`}
            >
              Team B
            </button>
            <button
              onClick={() => chooseRole("observer")}
              className={`px-4 py-2 rounded ${
                role === "observer" ? "bg-green-600 text-white" : "bg-gray-300"
              }`}
            >
              Observer
            </button>
          </div>

          <h3 className="font-bold">Participants:</h3>
          <ul className="list-disc pl-5">
            {participants.map((p) => (
              <li key={p.userId}>
                {p.name} {p.userId === user._id && "(You)"} - {p.role || "not chosen"}
              </li>
            ))}
          </ul>

          {participants[0]?.userId === user._id && (
            <button
              onClick={() => socket.emit("startDebate", { roomId })}
              disabled={!role}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Debate
            </button>
          )}
        </div>
      ) : debateEnded ? (
        <div className="border rounded p-6 flex flex-col gap-4 bg-white shadow-lg max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-green-600">
            🏆 Debate Ended!
          </h2>

          {debateResult?.aiAnalysisFailed && (
            <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-yellow-800 text-sm">
                ⚠️ AI analysis unavailable. All debate arguments have been saved
                and can be reviewed in your history.
              </p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="font-bold text-lg mb-3 text-gray-800">Results</h3>

            <div className="mb-3 p-3 bg-white rounded border-l-4 border-green-500">
              <strong className="text-gray-700">Winner:</strong>{" "}
              <span className="text-green-600 font-semibold text-lg">
                {debateResult?.winner || "To be determined"}
              </span>
            </div>

            {debateResult?.score_team_a !== undefined && !debateResult?.aiAnalysisFailed && (
              <div className="mb-3 p-3 bg-white rounded">
                <strong className="text-gray-700 block mb-2">Scores:</strong>
                <div className="flex gap-4 justify-around">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {debateResult.score_team_a?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-sm text-gray-600">Team A</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {debateResult.score_team_b?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-sm text-gray-600">Team B</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-3 p-3 bg-white rounded">
              <strong className="text-gray-700">Total Arguments:</strong>{" "}
              <span className="text-gray-900">
                {debateResult?.totalArguments || messages.length}
              </span>
            </div>

            {debateResult?.justification && (
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <strong className="text-gray-700 block mb-1">Justification:</strong>
                <p className="text-gray-800 leading-relaxed">
                  {debateResult.justification}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-500 font-bold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 border rounded p-4 overflow-y-auto bg-gray-50 shadow-inner flex flex-col space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className="my-1 p-2 rounded-md bg-gray-200 text-black wrap-break-word"
              >
                <strong>
                  {msg.name} ({msg.role}):
                </strong>{" "}
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {role !== "observer" && (
            <div className="mt-4 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 border p-2 rounded-l"
                placeholder="Type your argument..."
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white px-4 rounded hover:bg-blue-500"
              >
                Send
              </button>
              <button
                onClick={finishDebate}
                className="bg-red-600 text-white px-4 rounded hover:bg-red-500"
              >
                Finish
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
