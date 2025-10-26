import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../services/api";

export default function DebateHistory() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebateDetails();
  }, [roomId]);

  const fetchDebateDetails = async () => {
    try {
      const response = await axios.get(`/debates/details/${roomId}`);
      setDebate(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching debate details:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 max-w-4xl mx-auto p-4">
        <p className="text-center">Loading debate history...</p>
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="pt-24 max-w-4xl mx-auto p-4">
        <p className="text-center text-red-600">Debate not found</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-2">{debate.topic}</h1>
        <p className="text-gray-600">
          Type: {debate.type} | Status: {debate.status} | 
          Ended: {new Date(debate.endedAt).toLocaleString()}
        </p>
      </div>

      {/* Results Section */}
      <div className="mb-6 border rounded-lg p-6 bg-white shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-green-600">
          🏆 Final Results
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Winner */}
          <div className="p-4 bg-green-50 rounded border-l-4 border-green-500">
            <strong className="text-gray-700">Winner:</strong>
            <p className="text-green-600 font-semibold text-lg">
              {debate.winner || "No winner declared"}
            </p>
          </div>

          {/* Scores */}
          {debate.scores && (
            <div className="p-4 bg-blue-50 rounded">
              <strong className="text-gray-700 block mb-2">Scores:</strong>
              <div className="flex gap-4 justify-around">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {debate.scores.teamA || 0}
                  </div>
                  <div className="text-sm text-gray-600">Team A</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {debate.scores.teamB || 0}
                  </div>
                  <div className="text-sm text-gray-600">Team B</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {debate.aiSummary && (
          <div className="p-4 bg-gray-50 rounded mb-4">
            <strong className="text-gray-700 block mb-2">Summary:</strong>
            <p className="text-gray-800 leading-relaxed">{debate.aiSummary}</p>
          </div>
        )}

        {/* Reasoning */}
        {debate.reasoning && (
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <strong className="text-gray-700 block mb-2">Reasoning:</strong>
            <p className="text-gray-800 leading-relaxed">{debate.reasoning}</p>
          </div>
        )}
      </div>

      {/* Messages/Arguments Section */}
      <div className="border rounded-lg p-6 bg-white shadow">
        <h2 className="text-2xl font-bold mb-4">Debate Messages</h2>
        
        {debate.arguments && debate.arguments.length > 0 ? (
          <div className="space-y-3">
            {debate.arguments.map((arg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  arg.team === "teamA" || arg.team === "A"
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : arg.team === "teamB" || arg.team === "B"
                    ? "bg-red-50 border-l-4 border-red-500"
                    : "bg-green-50 border-l-4 border-green-500"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <strong className="text-gray-800">
                    {arg.name || "User"} ({arg.team || arg.role})
                  </strong>
                  <span className="text-xs text-gray-500">
                    {new Date(arg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700">{arg.message || arg.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No messages recorded</p>
        )}
      </div>
    </div>
  );
}
