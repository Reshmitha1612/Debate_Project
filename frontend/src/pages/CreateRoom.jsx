import { useState, useContext } from "react";
import axios from "../services/api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function CreateRoom() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("team");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!topic.trim()) {
      setError("Please enter a debate topic");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/debates/create", {
        topic: topic.trim(),
        type: type,
        maxParticipantsA: type === "1v1" ? 1 : 4,
        maxParticipantsB: type === "1v1" ? 1 : 4,
      });

      const newRoomId = res.data.roomId;
      setRoomId(newRoomId);
      setInviteLink(`${window.location.origin}/debate/${newRoomId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterRoom = () => {
    navigate(`/debate/${roomId}`);
  };

  return (
    <div className="pt-24 max-w-2xl mx-auto p-4">
      {!roomId ? (
        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-3xl font-bold mb-6 text-center">Create Debate Room</h2>

          <div className="mb-4">
            <label className="block font-semibold mb-2 text-gray-700">
              Debate Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setError("");
              }}
              placeholder="e.g., Should AI replace human teachers?"
              className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block font-semibold mb-2 text-gray-700">
              Debate Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setType("team")}
                disabled={loading}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  type === "team"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                } ${loading ? "opacity-50" : ""}`}
              >
                <div className="font-bold">Team Debate</div>
                <div className="text-sm text-gray-600">Up to 4 vs 4</div>
              </button>
              <button
                onClick={() => setType("1v1")}
                disabled={loading}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  type === "1v1"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                } ${loading ? "opacity-50" : ""}`}
              >
                <div className="font-bold">1v1 Debate</div>
                <div className="text-sm text-gray-600">One vs One</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-500 font-bold disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Room"}
          </button>
        </div>
      ) : (
        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-3xl font-bold text-green-600 mb-4 text-center">
            ✅ Room Created Successfully!
          </h2>

          <div className="mb-6 p-4 bg-gray-50 rounded">
            <div className="mb-2">
              <strong className="text-gray-700">Topic:</strong>
              <p className="text-gray-900">{topic}</p>
            </div>
            <div className="mb-2">
              <strong className="text-gray-700">Type:</strong>
              <p className="text-gray-900">
                {type === "team" ? "Team Debate (4v4)" : "1v1 Debate"}
              </p>
            </div>
            <div>
              <strong className="text-gray-700">Room ID:</strong>
              <p className="font-mono text-gray-900">{roomId}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-semibold mb-2 text-gray-700">
              Invite Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 border p-3 rounded-lg bg-white"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert("Invite link copied!");
                }}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-500"
              >
                📋 Copy
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleEnterRoom}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-500 font-bold"
            >
              Enter Lobby
            </button>
            <button
              onClick={() => {
                setRoomId(null);
                setInviteLink("");
                setTopic("");
                setType("team");
              }}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-500 font-bold"
            >
              Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
