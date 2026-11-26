import { Router } from "express";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { requireAuth, getAuthUser } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  const authUser = getAuthUser(req);
  const quizzes = await Quiz.find()
    .select("title subject description durationMinutes level questions createdBy")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    quizzes: quizzes.map(({ questions, ...quiz }) => ({
      ...quiz,
      questionCount: questions.length,
      isOwner: Boolean(
        authUser && quiz.createdBy && String(quiz.createdBy) === authUser.userId
      ),
    })),
  });
});

router.get("/:id/edit", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid quiz id." });
  }

  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: "Quiz not found." });
  if (!quiz.createdBy || String(quiz.createdBy) !== req.user.userId) {
    return res.status(403).json({ message: "You can only edit quizzes you created." });
  }

  res.json({ quiz });
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
      questions: quiz.questions.map(({ text, options, explanation }) => ({
        text,
        options,
        explanation: explanation || "",
      })),
    },
  });
});

router.put("/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid quiz id." });
  }

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found." });
  if (!quiz.createdBy || String(quiz.createdBy) !== req.user.userId) {
    return res.status(403).json({ message: "You can only edit quizzes you created." });
  }

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
        (question.explanation === undefined ||
          (typeof question.explanation === "string" &&
            question.explanation.length <= 1000)) &&
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
        "Provide a valid title, subject, description, duration, level, and complete questions.",
    });
  }

  Object.assign(quiz, {
    title,
    subject,
    description,
    durationMinutes,
    level,
    questions,
  });
  await quiz.save();

  res.json({
    quiz: {
      _id: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
      level: quiz.level,
      questionCount: quiz.questions.length,
      createdBy: quiz.createdBy,
      isOwner: true,
    },
  });
});

router.delete("/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid quiz id." });
  }

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found." });
  if (!quiz.createdBy || String(quiz.createdBy) !== req.user.userId) {
    return res.status(403).json({ message: "You can only delete quizzes you created." });
  }

  await QuizAttempt.deleteMany({ quiz: quiz._id });
  await quiz.deleteOne();
  res.json({ success: true });
});

router.post("/", requireAuth, async (req, res) => {
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
        (question.explanation === undefined ||
          (typeof question.explanation === "string" &&
            question.explanation.length <= 1000)) &&
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
        "Provide a title, subject, description, valid duration and level, and 1–50 questions with four options, one correct answer, and an explanation for each.",
    });
  }

  const quiz = await Quiz.create({
    createdBy: req.user.userId,
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
      createdBy: quiz.createdBy,
      isOwner: true,
    },
  });
});

router.post("/:id/check-answer", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid quiz id." });
  }

  const { questionIndex, answerIndex } = req.body;
  if (
    !Number.isInteger(questionIndex) ||
    !Number.isInteger(answerIndex) ||
    answerIndex < 0 ||
    answerIndex > 3
  ) {
    return res.status(400).json({ message: "Provide a valid question and answer." });
  }

  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).json({ message: "Quiz not found." });
  if (questionIndex < 0 || questionIndex >= quiz.questions.length) {
    return res.status(400).json({ message: "Question not found." });
  }

  const question = quiz.questions[questionIndex];
  res.json({
    isCorrect: answerIndex === question.correctIndex,
    correctIndex: question.correctIndex,
    correctAnswer: question.options[question.correctIndex],
    explanation: question.explanation || "",
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
    user: getAuthUser(req)?.userId || null,
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
