import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../services/api";

export default function DebateHistory() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchDebateDetails();
    // eslint-disable-next-line
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

  const retryAnalysis = async () => {
    if (!debate?.arguments || debate.arguments.length === 0) {
      alert("No arguments found in this debate. Cannot perform analysis.");
      return;
    }

    if (!window.confirm("Retry AI analysis for this debate?")) return;

    setAnalyzing(true);
    try {
      const analyzeResponse = await axios.post(`/debates/analyze/${roomId}`);
      if (analyzeResponse.data && analyzeResponse.data.result) {
        const result = analyzeResponse.data.result;
        setDebate({
          ...debate,
          winner: result.winner,
          justification: result.justification,
          score_team_a: result.score_team_a,
          score_team_b: result.score_team_b,
        });
        alert("AI analysis completed successfully!");
      }
    } catch (err) {
      if (err.response) {
        const errorMsg = err.response.data?.msg || err.response.data?.error || "Unknown error";
        if (errorMsg.includes("No arguments")) {
          alert("This debate has no arguments to analyze. Participants must send messages during the debate.");
        } else if (errorMsg.includes("AI service not configured")) {
          alert("AI analysis service is not configured. Please contact the administrator.");
        } else {
          alert(`Failed to retry analysis: ${errorMsg}`);
        }
      } else {
        alert("Failed to retry analysis. Please try again later.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const analysisFailedOrMissing =
    !debate?.winner ||
    debate.winner === "Analysis failed" ||
    debate.winner === "Analysis pending" ||
    !debate?.justification ||
    debate.justification?.includes("Error:") ||
    debate.justification === "AI analysis unavailable";

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
          Type: {debate.type} | Status: {debate.status}
        </p>
      </div>

      {/* Results Section */}
      <div className="mb-6 border rounded-lg p-6 bg-white shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-green-600">🏆 Final Results</h2>
          {analysisFailedOrMissing && debate.arguments && debate.arguments.length > 0 && (
            <button
              onClick={retryAnalysis}
              disabled={analyzing}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {analyzing ? "Analyzing..." : "Retry Analysis"}
            </button>
          )}
        </div>
        {analysisFailedOrMissing && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
            <p className="text-yellow-800 text-sm">
              {debate.arguments && debate.arguments.length > 0 ? (
                <>⚠️ AI analysis failed. Click "Retry Analysis" to try again.</>
              ) : (
                <>⚠️ This debate has no arguments. AI analysis cannot be performed.</>
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Winner */}
          <div className="p-4 bg-green-50 rounded border-l-4 border-green-500">
            <strong className="text-gray-700">Winner:</strong>
            <p className="text-green-600 font-semibold text-lg">
              {debate.winner || "No winner declared"}
            </p>
          </div>
          {/* Scores */}
          {(debate.score_team_a !== undefined || debate.score_team_b !== undefined) && (
            <div className="p-4 bg-blue-50 rounded">
              <strong className="text-gray-700 block mb-2">Scores:</strong>
              <div className="flex gap-4 justify-around">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {debate.score_team_a?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600">Team A</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {debate.score_team_b?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600">Team B</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <strong className="text-gray-700">Total Arguments:</strong>{" "}
          <span className="text-gray-900">{debate.arguments?.length || 0}</span>
        </div>
        {debate.justification && (
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <strong className="text-gray-700 block mb-2">Justification:</strong>
            <p className="text-gray-800 leading-relaxed">{debate.justification}</p>
          </div>
        )}
      </div>
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
