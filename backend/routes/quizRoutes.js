import { Router } from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";

const router = Router();

router.get("/", async (req, res) => {
  const quizzes = await Quiz.find()
    .select("title subject description durationMinutes level questions")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    quizzes: quizzes.map(({ questions, ...quiz }) => ({
      ...quiz,
      questionCount: questions.length,
    })),
  });
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid quiz id." });
  }

  const quiz = await Quiz.findById(req.params.id).lean();

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found." });
  }

  res.json({
    quiz: {
      ...quiz,
      questions: quiz.questions.map(({ text, options }) => ({ text, options })),
    },
  });
});

router.post("/", async (req, res) => {
  const { title, subject, description, durationMinutes, level, questions } =
    req.body;

  const validLevels = ["Beginner", "Intermediate", "Advanced"];
  const validQuestions =
    Array.isArray(questions) &&
    questions.length > 0 &&
    questions.length <= 50 &&
    questions.every(
      (question) =>
        typeof question.text === "string" &&
        question.text.trim() &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        question.options.every(
          (option) => typeof option === "string" && option.trim()
        ) &&
        Number.isInteger(question.correctIndex) &&
        question.correctIndex >= 0 &&
        question.correctIndex < 4
    );

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof subject !== "string" ||
    !subject.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 180 ||
    !validLevels.includes(level) ||
    !validQuestions
  ) {
    return res.status(400).json({
      message:
        "Provide a title, subject, description, valid duration and level, and 1–50 questions with four options and one correct answer each.",
    });
  }

  const quiz = await Quiz.create({
    title,
    subject,
    description,
    durationMinutes,
    level,
    questions,
  });

  res.status(201).json({
    quiz: {
      _id: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
      level: quiz.level,
      questionCount: quiz.questions.length,
    },
  });
});

router.post("/:id/attempts", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid quiz id." });
  }

  const quiz = await Quiz.findById(req.params.id).lean();

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found." });
  }

  const { answers } = req.body;
  const validAnswers =
    Array.isArray(answers) &&
    answers.length === quiz.questions.length &&
    answers.every(
      (answer) =>
        Number.isInteger(answer) &&
        answer >= -1 &&
        answer < quiz.questions[0].options.length
    );

  if (!validAnswers) {
    return res.status(400).json({
      message: "Submit one selected option (or -1 for unanswered) per question.",
    });
  }

  const score = quiz.questions.reduce(
    (total, question, index) =>
      total + Number(answers[index] === question.correctIndex),
    0
  );
  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    answers,
    score,
    total: quiz.questions.length,
  });

  res.status(201).json({
    attemptId: attempt._id,
    score,
    total: quiz.questions.length,
    percentage: Math.round((score / quiz.questions.length) * 100),
    results: quiz.questions.map((question, index) => ({
      ...question,
      selectedIndex: answers[index],
    })),
  });
});

export default router;
