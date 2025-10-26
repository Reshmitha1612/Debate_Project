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
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ msg: "Name must be at least 2 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ 
      name: name.trim(), 
      email: email.toLowerCase(), 
      password: hashed 
    });
    
    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );
    
    res.cookie("token", token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    console.log(`✅ User created: ${user.name} (${user.email})`);
    
    res.json({ 
      _id: user._id,
      name: user.name, 
      email: user.email 
    });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) {
      res.status(400).json({ msg: "Email already exists" });
    } else {
      res.status(500).json({ msg: "Error creating account" });
    }
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );
    
    res.cookie("token", token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    console.log(`✅ User logged in: ${user.name} (${user.email})`);
    
    res.json({ 
      _id: user._id,
      name: user.name, 
      email: user.email 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  console.log("✅ User logged out");
  res.json({ msg: "Logged out successfully" });
});

// Get current user
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
