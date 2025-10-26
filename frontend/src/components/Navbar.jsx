import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("http://localhost:5000/api/logout", { credentials: "include" });
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="bg-blue-600 text-white fixed w-full top-0 shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">DebateApp</Link>
        <div className="space-x-4">
          {!user ? (
            <>
              <Link to="/login" className="hover:bg-blue-500 px-3 py-1 rounded">Login</Link>
              <Link to="/signup" className="hover:bg-blue-500 px-3 py-1 rounded">Signup</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="bg-green-500 hover:bg-green-400 px-3 py-1 rounded">Dashboard</Link>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-400 px-3 py-1 rounded">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
