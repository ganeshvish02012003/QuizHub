import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 500 },
    options: {
      type: [{ type: String, required: true, trim: true, maxlength: 200 }],
      validate: {
        validator: (options) => options.length === 4 && options.every(Boolean),
        message: "Each question must have four non-empty options.",
      },
    },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    subject: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    durationMinutes: { type: Number, required: true, min: 1, max: 180 },
    level: {
      type: String,
      required: true,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (questions) =>
          questions.length > 0 && questions.length <= 50,
        message: "A quiz must contain between 1 and 50 questions.",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
