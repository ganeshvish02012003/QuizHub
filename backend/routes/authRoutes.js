import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function authToken(userId) {
  return jwt.sign(
    { userId: String(userId) },
    process.env.JWT_SECRET || "quizhub-development-secret",
    { expiresIn: "7d" }
  );
}

function authCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    partitioned: isProduction,
    path: "/",
  };
}

function setAuthCookie(res, token) {
  res.cookie("quizhub_token", token, {
    ...authCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 60 ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    return res.status(400).json({
      message: "Provide a name, valid email, and a password of at least 6 characters.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });
  setAuthCookie(res, authToken(user._id));

  res.status(201).json({
    user: { _id: user._id, name: user.name, email: user.email },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  setAuthCookie(res, authToken(user._id));
  res.json({ user: { _id: user._id, name: user.name, email: user.email } });
});

router.post("/logout", (req, res) => {
  res.clearCookie("quizhub_token", authCookieOptions());
  res.json({ success: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.userId).select("name email");
  if (!user) return res.status(401).json({ message: "Session expired." });

  const createdQuizzes = await Quiz.find({ createdBy: user._id })
    .select("title subject description durationMinutes level questions")
    .sort({ createdAt: -1 })
    .lean();
  const attempts = await QuizAttempt.find({ user: user._id })
    .populate("quiz", "title subject")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    user: { _id: user._id, name: user.name, email: user.email },
    createdQuizzes: createdQuizzes.map(({ questions, ...quiz }) => ({
      ...quiz,
      questionCount: questions.length,
    })),
    attempts,
  });
});

export default router;
