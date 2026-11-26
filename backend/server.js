
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import quizRoutes from "./routes/quizRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { seedQuizzes } from "./data/seedQuizzes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to QuizHub API",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "QuizHub backend is running",
  });
});


app.get("/api/health/db", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    database: connected ? "connected" : "disconnected",
  });
});

app.use("/api/quizzes", quizRoutes);
app.use("/api/auth", authRoutes);

app.use((error, req, res, next) => {
  console.error("API request failed:", error.message);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

function mongooseConnectionReady() {
  return Boolean(globalThis.__quizHubDBReady);
}

async function startServer() {
  try {
    await connectDB();
    await seedQuizzes();
    globalThis.__quizHubDBReady = true;

    app.listen(PORT, () => {
      console.log(`QuizHub backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
