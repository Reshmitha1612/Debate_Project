import { createContext, useState, useEffect } from "react";
import axios from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Fetch user from backend to maintain session (e.g. with HttpOnly cookie)
  const fetchUser = async () => {
    try {
      const res = await axios.get("/user", { withCredentials: true });
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch {
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Logout clears user both locally and from server if necessary
  const logout = async () => {
    try {
      await axios.post("/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error:", err.response?.data?.msg || err.message);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
