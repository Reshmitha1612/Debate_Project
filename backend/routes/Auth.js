import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true });
    res.json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(400).json({ msg: "Email already exists" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true });
    res.json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// Logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ msg: "Logged out" });
});

// Get current user
router.get("/user", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json(user);
});

export default router;
