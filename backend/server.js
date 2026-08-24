const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const { google } = require("googleapis");
const multer = require("multer");
const XLSX = require("xlsx");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cookieParser())
app.use(
  express.urlencoded({
    extended: true
  })
);

  const allowedOrigins = [
    "http://localhost:5173",
    "https://cec-portal.vercel.app"
  ];

  app.use(
    cors({
      origin: function (origin, callback) {

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }

      },

      credentials: true,

      methods: [
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS"
      ],

      allowedHeaders: [
        "Content-Type",
        "Authorization"
      ]
    })
  );




const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});




const auth = new google.auth.GoogleAuth({
  credentials: {
    project_id: process.env.GOOGLE_PROJECT_ID,

    client_email: process.env.GOOGLE_CLIENT_EMAIL,

    private_key: process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined
  },

  scopes: [
    "https://www.googleapis.com/auth/spreadsheets"
  ]
});

const sheets = google.sheets({
  version: "v4",
  auth
});




const addToGoogleSheet = async (submission) => {

  try {

    if (!process.env.GOOGLE_SPREADSHEET_ID) {

      console.log(
        "⚠️ GOOGLE_SPREADSHEET_ID is not configured"
      );

      return;

    }


    await sheets.spreadsheets.values.append({

      spreadsheetId:
        process.env.GOOGLE_SPREADSHEET_ID,

      range:
        "EduTrack Exam Submissions!A:G",

      valueInputOption:
        "USER_ENTERED",

      resource: {

        values: [[

          submission.name || "",

          submission.userEmail || "",

          submission.department || "",

          submission.examName || "",

          submission.totalQuestions || 0,

          submission.score || 0,

          submission.createdAt || new Date()

        ]]

      }

    });


    console.log(
      " Submission added to Google Sheet"
    );


  } catch (error) {

    console.error(
      "Google Sheets error:",
      error.message
    );

  }

};


// ======================================================
// USER SCHEMA
// ======================================================

const contactSchema = new mongoose.Schema(

  {

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },

    department: {
      type: String,
      default: ""
    },

    section: {
      type: String,
      default: ""
    }

  },

  {
    timestamps: true
  }

);


// ======================================================
// EXAM SCHEMA
// ======================================================

const examSchema = new mongoose.Schema(

  {

    title: {
      type: String,
      required: true,
      trim: true
    },

    duration_minutes: {
      type: Number,
      default: 60
    },

    questions: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    securityCode: {
      type: String,
      required: true
    }

  },

  {
    timestamps: true
  }

);


// Enable virtual id

examSchema.set("toJSON", {
  virtuals: true
});

examSchema.set("toObject", {
  virtuals: true
});


// ======================================================
// EXAM SUBMISSION SCHEMA
// ======================================================

const examSubmissionSchema = new mongoose.Schema(

  {

    name: {
      type: String,
      required: true
    },

    userEmail: {
      type: String,
      required: true
    },

    department: {
      type: String,
      required: true
    },

    examName: {
      type: String,
      required: true
    },

    userId: {
      type: String,
      required: true
    },

    examId: {
      type: String,
      required: true
    },

    userAnswers: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    score: {
      type: Number,
      default: 0
    },

    totalQuestions: {
      type: Number,
      default: 0
    },

    percentage: {
      type: Number,
      default: 0
    }

  },

  {
    timestamps: true
  }

);


// ======================================================
// PREVENT DUPLICATE EXAM ATTEMPTS
// ======================================================

examSubmissionSchema.index(
  {
    userId: 1,
    examId: 1
  },
  {
    unique: true
  }
);


// ======================================================
// PUBLISHED RESULT SCHEMA
// ======================================================

const publishedResultSchema = new mongoose.Schema(

  {

    testName: {
      type: String,
      required: true,
      trim: true
    },

    results: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    fileName: {
      type: String,
      default: ""
    }

  },

  {
    timestamps: true
  }

);


// ======================================================
// MODELS
// ======================================================

const User =
  mongoose.model(
    "Users",
    contactSchema
  );


const Exam =
  mongoose.model(
    "Exam",
    examSchema
  );


const ExamSubmission =
  mongoose.model(
    "ExamSubmission",
    examSubmissionSchema
  );


const PublishedResult =
  mongoose.model(
    "PublishedResult",
    publishedResultSchema
  );


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {

  res.status(200).send(
    "EduTrack Backend - Connected successfully"
  );

});


// ======================================================
// AUTH ROUTES
// ======================================================

// ------------------------------------------------------
// SIGNUP
// ------------------------------------------------------

app.post("/signup", async (req, res) => {

  try {

    const {
      name,
      email,
      password,
      department,
      section
    } = req.body;


    if (!name || !email || !password) {

      return res.status(400).json({

        success: false,

        message:
          "Name, email and password are required"

      });

    }


    const normalizedEmail =
      email.trim().toLowerCase();


    const existing =
      await User.findOne({
        email: normalizedEmail
      });


    if (existing) {

      return res.status(409).json({

        success: false,

        message:
          "Email already existed!"

      });

    }


    const newUser = new User({

      name: name.trim(),

      email: normalizedEmail,

      password,

      department:
        department || "",

      section:
        section || ""

    });


    await newUser.save();


    console.log(
      "✅ New user:",
      newUser.email
    );


    return res.status(201).json({

      success: true,

      status: 201,

      message:
        "Signup successfully!",

      data: newUser

    });


  } catch (error) {

    console.error(
      "Signup error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Signup failed",

      error:
        error.message

    });

  }

});


// ------------------------------------------------------
// LOGIN
// ------------------------------------------------------

app.post("/login", async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;


    if (!email || !password) {

      return res.status(400).json({

        success: false,

        message:
          "Email and password are required"

      });

    }


    const foundUser =
      await User.findOne({

        email:
          email.trim().toLowerCase(),

        password

      });


    if (!foundUser) {

      return res.status(401).json({

        success: false,

        status: 401,

        message:
          "Invalid email or password!"

      });

    }


    // ============================================
    // CREATE LOGIN TOKEN
    // ============================================

    const token = jwt.sign(

      {
        userId: foundUser._id,
        email: foundUser.email
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "30d"
      }

    );


    // ============================================
    // STORE TOKEN IN HTTP-ONLY COOKIE
    // ============================================

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });


    // ============================================
    // SEND NORMAL LOGIN RESPONSE
    // ============================================

    return res.status(200).json({

      success: true,

      status: 200,

      message:
        "User found!",

      data: foundUser

    });


  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Login failed",

      error:
        error.message

    });

  }

});

app.get("/auth/me", async (req, res) => {

  try {

    const token = req.cookies.token;

    // No token
    if (!token) {

      return res.status(401).json({
        loggedIn: false
      });

    }


    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    // Find user
    const user = await User.findById(
      decoded.userId
    ).select("-password");


    if (!user) {

      return res.status(401).json({
        loggedIn: false
      });

    }


    // User is logged in
    return res.status(200).json({

      loggedIn: true,

      user

    });


  } catch (error) {

    console.error(
      "Auth check error:",
      error.message
    );

    return res.status(401).json({
      loggedIn: false
    });

  }

});
// ======================================================
// EXAM ROUTES
// ======================================================


// ------------------------------------------------------
// GET ALL EXAMS
// ------------------------------------------------------

app.get(
  "/api/exams/all",
  async (req, res) => {

    try {

      const exams =
        await Exam.find()
          .sort({
            createdAt: -1
          });


      return res.status(200).json(
        exams
      );


    } catch (error) {

      console.error(
        "Get all exams error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to fetch exams",

        error:
          error.message

      });

    }

  }
);


// ------------------------------------------------------
// CREATE / PUBLISH EXAM
// ------------------------------------------------------

app.post(
  "/api/exams/create",
  async (req, res) => {

    try {

      const {
        title,
        duration_minutes,
        questions,
        securityCode
      } = req.body;


      // TITLE

      if (
        !title ||
        !title.trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Title is required"

        });

      }


      // QUESTIONS

      if (
        !questions ||
        !Array.isArray(questions) ||
        questions.length === 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "At least one question is required"

        });

      }


      // SECURITY CODE

      if (
        !securityCode ||
        !String(securityCode).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Security code is required"

        });

      }


      const exam =
        new Exam({

          title:
            title.trim(),

          duration_minutes:
            parseInt(
              duration_minutes
            ) || 60,

          questions,

          securityCode:
            String(
              securityCode
            ).trim()

        });


      const saved =
        await exam.save();


      return res.status(201).json({

        success: true,

        message:
          "Exam published successfully!",

        data:
          saved

      });


    } catch (error) {

      console.error(
        "Create exam error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to create exam",

        error:
          error.message

      });

    }

  }
);


// ------------------------------------------------------
// GET SINGLE EXAM
// ------------------------------------------------------

app.get(
  "/api/exams/:id",
  async (req, res) => {

    try {

      const exam =
        await Exam.findById(
          req.params.id
        );


      if (!exam) {

        return res.status(404).json({

          success: false,

          message:
            "Exam not found"

        });

      }


      return res.status(200).json(
        exam
      );


    } catch (error) {

      console.error(
        "Get exam error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to fetch exam",

        error:
          error.message

      });

    }

  }
);


// ------------------------------------------------------
// DELETE EXAM
// ------------------------------------------------------

app.delete(
  "/api/exams/delete/:id",
  async (req, res) => {

    try {

      const deleted =
        await Exam.findByIdAndDelete(
          req.params.id
        );


      if (!deleted) {

        return res.status(404).json({

          success: false,

          message:
            "Exam not found"

        });

      }


      return res.status(200).json({

        success: true,

        message:
          "Exam deleted successfully"

      });


    } catch (error) {

      console.error(
        "Delete exam error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to delete exam",

        error:
          error.message

      });

    }

  }
);


// ======================================================
// CHECK USER EXAM RESULT
// ======================================================

app.get(
  "/api/exams/result/:examId/:userId",
  async (req, res) => {

    try {

      const {
        examId,
        userId
      } = req.params;


      const submission =
        await ExamSubmission.findOne({

          examId:
            String(examId),

          userId:
            String(userId)

        });


      if (!submission) {

        return res.status(200).json({

          success: true,

          attempted: false,

          message:
            "Exam not attempted"

        });

      }


      return res.status(200).json({

        success: true,

        attempted: true,

        result: {

          id:
            submission._id,

          userId:
            submission.userId,

          examId:
            submission.examId,

          userAnswers:
            submission.userAnswers,

          score:
            submission.score,

          total_questions:
            submission.totalQuestions,

          percentage:
            submission.percentage,

          createdAt:
            submission.createdAt,

          updatedAt:
            submission.updatedAt

        }

      });


    } catch (error) {

      console.error(
        "Get exam result error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to retrieve exam result",

        error:
          error.message

      });

    }

  }
);


// ======================================================
// PUBLISHED RESULTS
// ======================================================


// ------------------------------------------------------
// PUBLISH EXCEL RESULT
// ------------------------------------------------------

// ======================================================
// PUBLISHED RESULTS ROUTES
// ======================================================

// POST /api/results/publish
// Upload Excel & save results

app.post(
  "/api/results/publish",
  upload.single("file"),
  async (req, res) => {

    try {

      const { testName } = req.body;

      // ----------------------------------------------
      // TEST NAME VALIDATION
      // ----------------------------------------------

      if (!testName || !testName.trim()) {

        return res.status(400).json({
          success: false,
          message: "Test Name is required"
        });

      }

      // ----------------------------------------------
      // FILE VALIDATION
      // ----------------------------------------------

      if (!req.file) {

        return res.status(400).json({
          success: false,
          message: "Excel file is required"
        });

      }

      const fileName =
        req.file.originalname.toLowerCase();

      if (
        !fileName.endsWith(".xlsx") &&
        !fileName.endsWith(".xls")
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Only Excel files (.xlsx or .xls) are allowed"
        });

      }

      // ----------------------------------------------
      // READ EXCEL
      // ----------------------------------------------

      const workbook = XLSX.read(
        req.file.buffer,
        {
          type: "buffer"
        }
      );

      // ----------------------------------------------
      // FIRST SHEET
      // ----------------------------------------------

      const sheetName =
        workbook.SheetNames[0];

      if (!sheetName) {

        return res.status(400).json({
          success: false,
          message:
            "Excel file does not contain any sheet"
        });

      }

      const worksheet =
        workbook.Sheets[sheetName];

      // ----------------------------------------------
      // IMPORTANT FIX
      //
      // Row 1 = title
      // Row 2 = actual column headers
      //
      // So skip row 1
      // ----------------------------------------------

      const results =
        XLSX.utils.sheet_to_json(
          worksheet,
          {
            defval: "",
            range: 1
          }
        );

      console.log(
        "EXCEL PARSED RESULTS:",
        results
      );

      // ----------------------------------------------
      // EMPTY FILE
      // ----------------------------------------------

      if (!results.length) {

        return res.status(400).json({
          success: false,
          message: "Excel file is empty"
        });

      }

      // ----------------------------------------------
      // SAVE TO MONGODB
      // ----------------------------------------------

      const publishedResult =
        new PublishedResult({

          testName:
            testName.trim(),

          results,

          fileName:
            req.file.originalname

        });

      const savedResult =
        await publishedResult.save();

      console.log(
        "✅ Result published:",
        savedResult.testName
      );

      // ----------------------------------------------
      // RESPONSE
      // ----------------------------------------------

      return res.status(201).json({

        success: true,

        message:
          "Result published successfully!",

        data:
          savedResult

      });

    } catch (error) {

      console.error(
        "❌ Publish result error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to publish result",

        error:
          error.message

      });

    }

  }
);


// ------------------------------------------------------
// GET ALL PUBLISHED RESULTS
// ------------------------------------------------------

app.get(
  "/api/results",
  async (req, res) => {

    try {

      const results =
        await PublishedResult.find()
          .sort({
            createdAt: -1
          });


      return res.status(200).json({

        success: true,

        count:
          results.length,

        data:
          results

      });


    } catch (error) {

      console.error(
        "Get published results error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to fetch published results",

        error:
          error.message

      });

    }

  }
);


// ------------------------------------------------------
// GET SINGLE PUBLISHED RESULT
// ------------------------------------------------------

app.get(
  "/api/results/:id",
  async (req, res) => {

    try {

      const result =
        await PublishedResult.findById(
          req.params.id
        );


      if (!result) {

        return res.status(404).json({

          success: false,

          message:
            "Published result not found"

        });

      }


      return res.status(200).json({

        success: true,

        data:
          result

      });


    } catch (error) {

      console.error(
        "Get result error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to fetch result",

        error:
          error.message

      });

    }

  }
);


// ------------------------------------------------------
// DELETE PUBLISHED RESULT
// ------------------------------------------------------

app.delete(
  "/api/results/:id",
  async (req, res) => {

    try {

      const deleted =
        await PublishedResult.findByIdAndDelete(
          req.params.id
        );


      if (!deleted) {

        return res.status(404).json({

          success: false,

          message:
            "Published result not found"

        });

      }


      return res.status(200).json({

        success: true,

        message:
          "Published result deleted successfully"

      });


    } catch (error) {

      console.error(
        "Delete result error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to delete result",

        error:
          error.message

      });

    }

  }
);


// ======================================================
// SUBMISSION ROUTES
// ======================================================


// ------------------------------------------------------
// SUBMIT EXAM
// ------------------------------------------------------

app.post(
  "/submitexam",
  async (req, res) => {

    try {

      const {

        name,

        userEmail,

        department,

        examName,

        userId,

        examId,

        userAnswers,

        questions

      } = req.body;


      // VALIDATION

      if (!userId) {

        return res.status(400).json({

          success: false,

          message:
            "userId is required"

        });

      }


      if (!examId) {

        return res.status(400).json({

          success: false,

          message:
            "examId is required"

        });

      }


      if (!userAnswers) {

        return res.status(400).json({

          success: false,

          message:
            "userAnswers are required"

        });

      }


      if (
        !Array.isArray(questions) ||
        questions.length === 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Questions are required"

        });

      }


      // --------------------------------------------------
      // CHECK PREVIOUS SUBMISSION
      // --------------------------------------------------

      const previousSubmission =
        await ExamSubmission.findOne({

          userId:
            String(userId),

          examId:
            String(examId)

        });


      if (previousSubmission) {

        return res.status(409).json({

          success: false,

          message:
            "You have already submitted this exam.",

          data: {

            submission:
              previousSubmission

          }

        });

      }


      // --------------------------------------------------
      // CALCULATE SCORE
      // --------------------------------------------------

      let score = 0;

      const totalQuestions =
        questions.length;


      questions.forEach(
        (question, index) => {

          const userAnswer =
            userAnswers[index];


          const correctAnswer =

            question.correct_option ||

            question.answer ||

            question.correctAnswer;


          if (

            userAnswer !== undefined &&

            userAnswer !== null &&

            correctAnswer !== undefined &&

            correctAnswer !== null

          ) {

            const userValue =
              String(
                userAnswer
              )
                .trim()
                .toLowerCase();


            const correctValue =
              String(
                correctAnswer
              )
                .trim()
                .toLowerCase();


            if (
              userValue === correctValue
            ) {

              score++;

            }

          }

        }
      );


      // --------------------------------------------------
      // PERCENTAGE
      // --------------------------------------------------

      const percentage =
        totalQuestions > 0

          ? Number(
              (
                (score / totalQuestions) *
                100
              ).toFixed(2)
            )

          : 0;


      // --------------------------------------------------
      // SAVE SUBMISSION
      // --------------------------------------------------

      const submission =
        new ExamSubmission({

          name:
            name || "",

          userEmail:
            userEmail || "",

          department:
            department || "N/A",

          examName:
            examName || "Exam",

          userId:
            String(userId),

          examId:
            String(examId),

          userAnswers,

          score,

          totalQuestions,

          percentage

        });


      const savedSubmission =
        await submission.save();


      // --------------------------------------------------
      // GOOGLE SHEETS
      // --------------------------------------------------

      await addToGoogleSheet(
        savedSubmission
      );


      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(201).json({

        success: true,

        message:
          "Exam submitted successfully",

        data: {

          submission:
            savedSubmission,

          stats: {

            score,

            totalQuestions,

            percentage

          }

        }

      });


    } catch (error) {

      console.error(
        "Submit exam error:",
        error
      );


      // Duplicate MongoDB index error

      if (error.code === 11000) {

        return res.status(409).json({

          success: false,

          message:
            "You have already submitted this exam."

        });

      }


      return res.status(500).json({

        success: false,

        message:
          "Failed to submit exam",

        error:
          error.message

      });

    }

  }
);


// ======================================================
// GET ALL SUBMISSIONS
// ======================================================

app.get(
  "/submissions",
  async (req, res) => {

    try {

      const submissions =
        await ExamSubmission.find()
          .sort({
            createdAt: -1
          });


      return res.status(200).json({

        success: true,

        count:
          submissions.length,

        data:
          submissions

      });


    } catch (error) {

      console.error(
        "Get submissions error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to retrieve submissions",

        error:
          error.message

      });

    }

  }
);


// ======================================================
// GET USER SUBMISSIONS
// ======================================================

app.get(
  "/submissions/user/:userId",
  async (req, res) => {

    try {

      const submissions =
        await ExamSubmission.find({

          userId:
            String(
              req.params.userId
            )

        }).sort({
          createdAt: -1
        });


      return res.status(200).json({

        success: true,

        count:
          submissions.length,

        data:
          submissions

      });


    } catch (error) {

      console.error(
        "Get user submissions error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to retrieve user submissions",

        error:
          error.message

      });

    }

  }
);


// ======================================================
// DATABASE CONNECTION
// ======================================================

const mongoURI =
  process.env.MONGO_URI;


if (!mongoURI) {

  console.error(
    " MONGO_URI is missing in environment variables"
  );

  process.exit(1);

}


mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {

    console.log(
      " MongoDB Connected"
    )


    app.listen(
      PORT,
      () => {

        console.log(
          ` Server running on port ${PORT}`
        );

        console.log(
          `http://localhost:${PORT}`
        );

      }
    );

  })

  .catch((error) => {

    console.error(
      " Failed to connect with MongoDB:",
      error.message
    );

    process.exit(1);

  });