import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import axios from "../services/api";

export default function Signup() {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/signup", form);
      setUser(res.data);
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err.response?.data?.msg || err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen pt-20">
      <h1 className="text-3xl font-bold mb-6">Signup</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-80">
        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border p-2 rounded" />
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border p-2 rounded" />
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">Signup</button>
      </form>
    </div>
  );
}
