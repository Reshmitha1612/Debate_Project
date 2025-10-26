import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import axios from "../services/api";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    fetchDebateHistory();
  }, []);

  const fetchDebateHistory = async () => {
    try {
      const response = await axios.get("/debates/history");
      setDebates(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching history:", err);
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setJoinError("Please enter a room ID");
      return;
    }

    setJoinError("");

    try {
      // Check if room exists
      const response = await axios.get(`/debates/room/${roomId}`);
      
      if (response.data) {
        // Navigate to the debate room
        navigate(`/debate/${roomId}`);
      }
    } catch (err) {
      console.error("Error joining room:", err);
      setJoinError(
        err.response?.data?.msg || "Room not found or access denied"
      );
    }
  };

  return (
    <div className="pt-24 max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}!</h1>
        <p className="text-gray-600">Manage your debates and view history</p>
      </div>

      {/* Action Buttons Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Create Room Card */}
        <div className="border rounded-lg p-6 bg-white shadow hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold mb-3">🎯 Create New Debate</h3>
          <p className="text-gray-600 mb-4">
            Start a new debate room and invite participants
          </p>
          <button
            onClick={() => navigate("/create-room")}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-500 font-bold"
          >
            + Create Room
          </button>
        </div>

        {/* Join Room Card */}
        <div className="border rounded-lg p-6 bg-white shadow hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold mb-3">🔗 Join Existing Debate</h3>
          <p className="text-gray-600 mb-4">
            Enter a room ID to join an ongoing debate
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value);
                setJoinError("");
              }}
              placeholder="Enter Room ID"
              className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {joinError && (
              <p className="text-red-500 text-sm">{joinError}</p>
            )}
            <button
              onClick={handleJoinRoom}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-500 font-bold"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>

      {/* Debate History Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">📚 Your Debate History</h2>

        {loading ? (
          <p className="text-gray-500">Loading history...</p>
        ) : debates.length === 0 ? (
          <div className="border rounded-lg p-8 text-center bg-gray-50">
            <p className="text-gray-500 mb-4">
              No debate history yet. Create your first debate!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {debates.map((debate) => (
              <div
                key={debate._id}
                onClick={() => navigate(`/debate-history/${debate.roomId}`)}
                className="border rounded-lg p-4 bg-white shadow hover:shadow-lg transition-shadow cursor-pointer"
              >
                <h3 className="font-bold text-lg mb-2 truncate">
                  {debate.topic}
                </h3>

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p>Type: {debate.type}</p>
                  <p>
                    Status:{" "}
                    <span className="text-green-600 font-semibold">
                      {debate.status}
                    </span>
                  </p>
                  <p>Arguments: {debate.arguments?.length || 0}</p>
                  {debate.winner && (
                    <p className="text-green-600 font-semibold">
                      Winner: {debate.winner}
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  Ended: {new Date(debate.endedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
