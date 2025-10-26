import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateRoom from "./pages/CreateRoom";
import DebateRoom from "./components/DebateRoom";
import DebateHistory from "./pages/DebateHistory"; // ← NEW IMPORT

function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useContext(AuthContext);
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Private Routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/create-room" element={<PrivateRoute><CreateRoom /></PrivateRoute>} />
        <Route path="/debate/:roomId" element={<PrivateRoute><DebateRoom /></PrivateRoute>} />
        
        {/* NEW ROUTE FOR DEBATE HISTORY */}
        <Route path="/debate-history/:roomId" element={<PrivateRoute><DebateHistory /></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default App;
