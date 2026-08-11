require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

app.use(express.json());
app.use(cors());

const PORT = 3000;

// ======================================================
// SCHEMAS & MODELS
// ======================================================

// --- User Schema ---
const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    department: { type: String },
    section: { type: String }
  },
  { timestamps: true }
);

// --- Exam Schema ---
const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    duration_minutes: { type: Number, default: 60 },
    questions: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);
// Expose _id as 'id' in JSON so frontend can use exam.id
examSchema.set("toJSON", { virtuals: true });
examSchema.set("toObject", { virtuals: true });

// --- Exam Submission Schema ---
const examSubmissionSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    userId: { type: String, required: true },
    examId: { type: String, required: true },
    userAnswers: { type: mongoose.Schema.Types.Mixed, required: true },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const User = mongoose.model("Users", contactSchema);
const Exam = mongoose.model("Exam", examSchema);
const ExamSubmission = mongoose.model("ExamSubmission", examSubmissionSchema);

// ======================================================
// AUTH ROUTES
// ======================================================

app.get("/", (req, res) => {
  res.send("EduTrack Backend - Connected to route /");
});

// POST /signup
app.post("/signup", async (req, res) => {
  const usersignup = req.body;
  try {
    const existing = await User.findOne({ email: usersignup.email });
    if (existing) {
      return res.status(409).json({ status: 409, message: "Email already existed!" });
    }
    const newUser = new User(usersignup);
    await newUser.save();
    console.log("New user:", newUser.email);
    return res.status(200).json({ status: 200, message: "Signup successfully!", data: newUser });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({ status: 500, message: error.message });
  }
});

// POST /login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login route - email:", email);
  try {
    const foundUser = await User.findOne({ email, password });
    if (!foundUser) {
      return res.status(401).json({ status: 401, message: "Invalid email or password!" });
    }
    return res.status(200).json({ status: 200, message: "User found!", data: foundUser });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ status: 500, message: error.message });
  }
});

// ======================================================
// EXAM ROUTES  (/api/exams/*)
// ======================================================

// GET /api/exams/all  - Fetch all exams
app.get("/api/exams/all", async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    return res.status(200).json(exams);
  } catch (error) {
    console.error("Get all exams error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch exams", error: error.message });
  }
});

// POST /api/exams/create  - Create / publish a new exam
app.post("/api/exams/create", async (req, res) => {
  try {
    const { title, duration_minutes, questions } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "At least one question is required" });
    }
    const exam = new Exam({ title: title.trim(), duration_minutes: parseInt(duration_minutes) || 60, questions });
    const saved = await exam.save();
    console.log("Exam created:", saved.title);
    return res.status(201).json({ success: true, message: "Exam published successfully!", data: saved });
  } catch (error) {
    console.error("Create exam error:", error);
    return res.status(500).json({ success: false, message: "Failed to create exam", error: error.message, details: error.message });
  }
});

// DELETE /api/exams/delete/:id  - Delete an exam
app.delete("/api/exams/delete/:id", async (req, res) => {
  try {
    const deleted = await Exam.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }
    return res.status(200).json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Delete exam error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete exam", error: error.message });
  }
});

// GET /api/exams/result/:examId/:userId  - Check if user attempted an exam
app.get("/api/exams/result/:examId/:userId", async (req, res) => {
  try {
    const { examId, userId } = req.params;
    const submission = await ExamSubmission.findOne({
      examId: String(examId),
      userId: String(userId)
    });

    if (!submission) {
      return res.status(200).json({ success: true, attempted: false, message: "Exam not attempted" });
    }

    return res.status(200).json({
      success: true,
      attempted: true,
      result: {
        id: submission._id,
        userId: submission.userId,
        examId: submission.examId,
        userAnswers: submission.userAnswers,
        user_answers: submission.userAnswers,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        total_questions: submission.totalQuestions,
        percentage: submission.percentage,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      }
    });
  } catch (error) {
    console.error("Get exam result error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve exam result", error: error.message });
  }
});

// GET /api/exams/:id  - Get single exam by id
app.get("/api/exams/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }
    return res.status(200).json(exam);
  } catch (error) {
    console.error("Get exam error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch exam", error: error.message });
  }
});

// ======================================================
// SUBMISSION ROUTES
// ======================================================

// POST /submitexam
app.post("/submitexam", async (req, res) => {
  try {
    const {userEmail, userId, examId, userAnswers, questions } = req.body;

    console.log("=================================");
    console.log("EXAM SUBMISSION");
    console.log("User ID:", userId);
    console.log("Exam ID:", examId);
    console.log("=================================");

    if (!userId) return res.status(400).json({ success: false, message: "userId is required" });
    if (!examId) return res.status(400).json({ success: false, message: "examId is required" });
    if (!userAnswers) return res.status(400).json({ success: false, message: "userAnswers are required" });

    // Prevent duplicate submission
    const previousSubmission = await ExamSubmission.findOne({
      userId: String(userId),
      examId: String(examId)
    });

    if (previousSubmission) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this exam.",
        data: {
          submission: previousSubmission,
          stats: {
            score: previousSubmission.score,
            totalQuestions: previousSubmission.totalQuestions,
            percentage: previousSubmission.percentage
          }
        }
      });
    }

    // Score Calculation
    let score = 0;
    let totalQuestions = 0;

    if (Array.isArray(questions)) {
      totalQuestions = questions.length;
      questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = question.correct_option || question.answer || question.correctAnswer;
        if (
          userAnswer &&
          correctAnswer &&
          String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()
        ) {
          score++;
        }
      });
    }

    const percentage = totalQuestions > 0 ? Number(((score / totalQuestions) * 100).toFixed(2)) : 0;

    console.log("Score:", score, "/ Total:", totalQuestions, "/ Percentage:", percentage);

    const submission = new ExamSubmission({
      userEmail : String(userEmail),
      userId: String(userId),
      examId: String(examId),
      userAnswers,
      score,
      totalQuestions,
      percentage
    });

    const savedSubmission = await submission.save();
    console.log("Submission saved:", savedSubmission._id);

    return res.status(201).json({
      success: true,
      message: "Exam submitted successfully",
      data: { submission: savedSubmission, stats: { score, totalQuestions, percentage } }
    });

  } catch (error) {
    console.error("Submit exam error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit exam", error: error.message });
  }
});

// GET /result/:examId/:userId  (legacy route kept for backward compat)
app.get("/result/:examId/:userId", async (req, res) => {
  try {
    const { examId, userId } = req.params;
    const submission = await ExamSubmission.findOne({ examId: String(examId), userId: String(userId) });

    if (!submission) {
      return res.status(200).json({ success: true, attempted: false, message: "Exam not attempted" });
    }

    return res.status(200).json({
      success: true,
      attempted: true,
      result: {
        id: submission._id,
        userId: submission.userId,
        examId: submission.examId,
        userAnswers: submission.userAnswers,
        user_answers: submission.userAnswers,
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        total_questions: submission.totalQuestions,
        percentage: submission.percentage,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      }
    });
  } catch (error) {
    console.error("Get result error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve exam result", error: error.message });
  }
});

// GET /submissions/user/:userId
app.get("/submissions/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const submissions = await ExamSubmission.find({ userId: String(userId) }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    console.error("Get user submissions error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve submissions", error: error.message });
  }
});

// GET /submissions
app.get("/submissions", async (req, res) => {
  try {
    const submissions = await ExamSubmission.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    console.error("Get submissions error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve submissions", error: error.message });
  }
});

// ======================================================
// CONNECT TO MONGODB & START SERVER
// ======================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect with MongoDB", error);
    process.exit(1);
  });
