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
        explanation: "Electric charge is measured in coulombs. One coulomb is the charge transported by a current of one ampere in one second.",
      },
      {
        text: "What is the approximate acceleration due to gravity on Earth?",
        options: ["8.9 m/s²", "9.8 m/s²", "10.8 m/s²", "11.8 m/s²"],
        correctIndex: 1,
        explanation: "The standard approximate acceleration due to gravity near Earth's surface is 9.8 metres per second squared.",
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
        explanation: "Newton's first law states that an object stays at rest or in uniform motion unless acted upon by an external force.",
      },
      {
        text: "What is the SI unit of energy?",
        options: ["Watt", "Newton", "Joule", "Pascal"],
        correctIndex: 2,
        explanation: "The joule is the SI unit of energy and work.",
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
        explanation: "Average speed is calculated by dividing the total distance travelled by the total time taken.",
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
        explanation: "Subtracting 3 from both sides gives 2x = 8, and dividing by 2 gives x = 4.",
      },
      {
        text: "What is the area of a triangle with base 8 and height 5?",
        options: ["13", "20", "40", "80"],
        correctIndex: 1,
        explanation: "The area of a triangle is half the base multiplied by the height: 1/2 x 8 x 5 = 20.",
      },
      {
        text: "What is the approximate value of π to two decimal places?",
        options: ["3.14", "3.41", "2.14", "4.13"],
        correctIndex: 0,
        explanation: "Pi is approximately 3.14159, which rounds to 3.14 to two decimal places.",
      },
      {
        text: "What is the square root of 144?",
        options: ["10", "11", "12", "14"],
        correctIndex: 2,
        explanation: "Twelve multiplied by twelve is 144, so the square root of 144 is 12.",
      },
      {
        text: "What is sin(90°)?",
        options: ["0", "0.5", "1", "−1"],
        correctIndex: 2,
        explanation: "At 90 degrees, the sine function has its maximum value of 1.",
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
        explanation: "Jupiter is the largest planet in our solar system by both diameter and mass.",
      },
      {
        text: "What is the capital of Japan?",
        options: ["Kyoto", "Tokyo", "Osaka", "Nagoya"],
        correctIndex: 1,
        explanation: "Tokyo is Japan's national capital and largest metropolitan area.",
      },
      {
        text: "What is the chemical symbol for gold?",
        options: ["Go", "Gd", "Ag", "Au"],
        correctIndex: 3,
        explanation: "Au is the chemical symbol for gold, derived from its Latin name aurum.",
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
        explanation: "The Pacific Ocean is Earth's largest and deepest ocean.",
      },
      {
        text: "In which year did India gain independence?",
        options: ["1945", "1947", "1950", "1952"],
        correctIndex: 1,
        explanation: "India gained independence from British rule on 15 August 1947.",
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
