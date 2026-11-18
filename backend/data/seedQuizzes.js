import Quiz from "../models/Quiz.js";

const starterQuizzes = [
  {
    title: "JEE Physics Challenge",
    subject: "Physics",
    description: "Test your knowledge of mechanics and electricity.",
    durationMinutes: 5,
    level: "Advanced",
    questions: [
      {
        text: "What is the SI unit of electric charge?",
        options: ["Ampere", "Coulomb", "Volt", "Ohm"],
        correctIndex: 1,
      },
      {
        text: "What is the approximate acceleration due to gravity on Earth?",
        options: ["8.9 m/s²", "9.8 m/s²", "10.8 m/s²", "11.8 m/s²"],
        correctIndex: 1,
      },
      {
        text: "Which law describes the inertia of an object?",
        options: [
          "Newton's first law",
          "Newton's second law",
          "Newton's third law",
          "Hooke's law",
        ],
        correctIndex: 0,
      },
      {
        text: "What is the SI unit of energy?",
        options: ["Watt", "Newton", "Joule", "Pascal"],
        correctIndex: 2,
      },
      {
        text: "How is average speed calculated?",
        options: [
          "Time ÷ distance",
          "Distance × time",
          "Distance ÷ time",
          "Distance + time",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    title: "Mathematics Master",
    subject: "Mathematics",
    description: "Practice algebra, geometry and trigonometry.",
    durationMinutes: 5,
    level: "Intermediate",
    questions: [
      {
        text: "Solve for x: 2x + 3 = 11.",
        options: ["3", "4", "5", "7"],
        correctIndex: 1,
      },
      {
        text: "What is the area of a triangle with base 8 and height 5?",
        options: ["13", "20", "40", "80"],
        correctIndex: 1,
      },
      {
        text: "What is the approximate value of π to two decimal places?",
        options: ["3.14", "3.41", "2.14", "4.13"],
        correctIndex: 0,
      },
      {
        text: "What is the square root of 144?",
        options: ["10", "11", "12", "14"],
        correctIndex: 2,
      },
      {
        text: "What is sin(90°)?",
        options: ["0", "0.5", "1", "−1"],
        correctIndex: 2,
      },
    ],
  },
  {
    title: "General Knowledge",
    subject: "General Knowledge",
    description: "Explore science, geography and history.",
    durationMinutes: 5,
    level: "Beginner",
    questions: [
      {
        text: "Which is the largest planet in our solar system?",
        options: ["Earth", "Saturn", "Jupiter", "Neptune"],
        correctIndex: 2,
      },
      {
        text: "What is the capital of Japan?",
        options: ["Kyoto", "Tokyo", "Osaka", "Nagoya"],
        correctIndex: 1,
      },
      {
        text: "What is the chemical symbol for gold?",
        options: ["Go", "Gd", "Ag", "Au"],
        correctIndex: 3,
      },
      {
        text: "Which is the largest ocean on Earth?",
        options: [
          "Atlantic Ocean",
          "Indian Ocean",
          "Arctic Ocean",
          "Pacific Ocean",
        ],
        correctIndex: 3,
      },
      {
        text: "In which year did India gain independence?",
        options: ["1945", "1947", "1950", "1952"],
        correctIndex: 1,
      },
    ],
  },
];

export async function seedQuizzes() {
  const count = await Quiz.countDocuments();

  if (count === 0) {
    await Quiz.insertMany(starterQuizzes);
    console.log("Starter quizzes added.");
  }
}
