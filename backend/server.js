const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const multer = require("multer");
const XLSX = require("xlsx");

app.use(express.json());
app.use(cors());

// Configure Multer for File Uploads in Memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PORT = process.env.PORT || 3000;

// ======================================================
// GOOGLE SHEETS
// ======================================================

const auth = new google.auth.GoogleAuth({
  credentials: {
    project_id: process.env.GOOGLE_PROJECT_ID,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

const addToGoogleSheet = async (submission) => {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: "EduTrack Exam Submissions!A:G",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[
          submission.name,
          submission.userEmail,
          submission.department,
          submission.examName,
          submission.totalQuestions,
          submission.score,
          submission.createdAt
        ]]
      }
    });

    console.log("✅ Submission added to Google Sheet");
  } catch (error) {
    console.error("❌ Google Sheets error:", error.message);
  }
};

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
    questions: { type: mongoose.Schema.Types.Mixed, required: true },
    securityCode: { type: String, required: true }
  },
  { timestamps: true }
);

examSchema.set("toJSON", { virtuals: true });
examSchema.set("toObject", { virtuals: true });

// --- Exam Submission Schema ---
const examSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userEmail: { type: String, required: true },
    department: { type: String, required: true },
    examName: { type: String, required: true },
    userId: { type: String, required: true },
    examId: { type: String, required: true },

    userAnswers: { type: mongoose.Schema.Types.Mixed, required: true },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// --- Published Result Schema ---
const publishedResultSchema = new mongoose.Schema(
  {
    testName: { type: String, required: true, trim: true },
    results: { type: mongoose.Schema.Types.Mixed, required: true },
    fileName: { type: String, default: "" }
  },
  { timestamps: true }
);

const User = mongoose.model("Users", contactSchema);
const Exam = mongoose.model("Exam", examSchema);
const ExamSubmission = mongoose.model("ExamSubmission", examSubmissionSchema);
const PublishedResult = mongoose.model("PublishedResult", publishedResultSchema);

// ======================================================
// AUTH ROUTES
// ======================================================

app.get("/", (req, res) => {
  res.send("EduTrack Backend - Connected to route /");
});

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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
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
// EXAM ROUTES (/api/exams/*)
// ======================================================

app.get("/api/exams/all", async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    return res.status(200).json(exams);
  } catch (error) {
    console.error("Get all exams error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch exams", error: error.message });
  }
});

app.post("/api/exams/create", async (req, res) => {
  try {
    const { title, duration_minutes, questions, securityCode } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "At least one question is required" });
    }
    const exam = new Exam({
      title: title.trim(),
      duration_minutes: parseInt(duration_minutes) || 60,
      questions,
      securityCode
    });
    const saved = await exam.save();
    return res.status(201).json({ success: true, message: "Exam published successfully!", data: saved });
  } catch (error) {
    console.error("Create exam error:", error);
    return res.status(500).json({ success: false, message: "Failed to create exam", error: error.message });
  }
});

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

app.get("/api/exams/result/:examId/:userId", async (req, res) => {
  const { examId, userId } = req.params;
  try {
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
        score: submission.score,
        totalQuestions: submission.totalQuestions,
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
// PUBLISHED RESULTS ROUTES (/api/results/*)
// ======================================================

// POST /api/results/publish - Upload Excel & save results
app.post("/api/results/publish", upload.single("file"), async (req, res) => {
  try {
    const { testName } = req.body;

    if (!testName || !testName.trim()) {
      return res.status(400).json({ success: false, message: "Test Name is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Excel file is required" });
    }

    const fileName = req.file.originalname.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return res.status(400).json({ success: false, message: "Only Excel files (.xlsx or .xls) are allowed" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({ success: false, message: "Excel file does not contain any sheet" });
    }

    const worksheet = workbook.Sheets[sheetName];
    const results = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!results.length) {
      return res.status(400).json({ success: false, message: "Excel file is empty" });
    }

    const publishedResult = new PublishedResult({
      testName: testName.trim(),
      results: results,
      fileName: req.file.originalname
    });

    const savedResult = await publishedResult.save();
    console.log("✅ Result published:", savedResult.testName);

    return res.status(201).json({
      success: true,
      message: "Result published successfully!",
      data: savedResult
    });

  } catch (error) {
    console.error("❌ Publish result error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish result",
      error: error.message
    });
  }
});

// GET /api/results - Get all published results
app.get("/api/results", async (req, res) => {
  try {
    const results = await PublishedResult.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error("Get published results error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch published results",
      error: error.message
    });
  }
});

// ======================================================
// SUBMISSION ROUTES
// ======================================================

app.post("/submitexam", async (req, res) => {
  try {
    const { name, userEmail, department, examName, userId, examId, userAnswers, questions } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: "userId is required" });
    if (!examId) return res.status(400).json({ success: false, message: "examId is required" });
    if (!userAnswers) return res.status(400).json({ success: false, message: "userAnswers are required" });

    const previousSubmission = await ExamSubmission.findOne({
      userId: String(userId),
      examId: String(examId)
    });

    if (previousSubmission) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this exam.",
        data: { submission: previousSubmission }
      });
    }

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

    const submission = new ExamSubmission({
      name,
      userEmail,
      department,
      examName,
      userId: String(userId),
      examId: String(examId),
      userAnswers,
      score,
      totalQuestions,
      percentage
    });

    const savedSubmission = await submission.save();
    await addToGoogleSheet(savedSubmission);

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