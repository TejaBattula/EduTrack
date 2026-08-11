const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Submit Exam & Store User Statistics
router.post('/submit', async (req, res) => {
  const { userId, examId, userAnswers } = req.body; 
  // userAnswers format: { questionIndex: selectedOption } e.g., { 0: "Option A", 1: "Option C" }

  try {
    // 1. Fetch Exam Details from DB
    const examRes = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examRes.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = examRes.rows[0];
    const questions = typeof exam.questions === 'string' ? JSON.parse(exam.questions) : exam.questions;

    // 2. Calculate Score (Every question = 1 Mark)
    let score = 0;
    const totalQuestions = questions.length;

    questions.forEach((q, index) => {
      const selected = userAnswers[index];
      if (selected && selected.trim().toLowerCase() === q.correct_option?.trim().toLowerCase()) {
        score += 1;
      }
    });

    const percentage = ((score / totalQuestions) * 100).toFixed(2);

    // 3. Store Statistics in Database
    const insertQuery = `
      INSERT INTO test_results (user_id, exam_id, score, total_questions, percentage)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const resultRes = await pool.query(insertQuery, [userId, examId, score, totalQuestions, percentage]);

    // 4. Return Calculated Result for Immediate Display
    res.json({
      message: 'Exam submitted successfully!',
      stats: {
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        submittedAt: resultRes.rows[0].submitted_at
      }
    });

  } catch (err) {
    console.error('❌ Submit Exam Error:', err);
    res.status(500).json({ error: 'Failed to process exam submission' });
  }
});

// Check User Exam Result Status
router.get('/result/:examId/:userId', async (req, res) => {
  const { examId, userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM test_results WHERE exam_id = $1 AND user_id = $2 ORDER BY submitted_at DESC LIMIT 1',
      [examId, userId]
    );

    if (result.rows.length > 0) {
      res.json({ attempted: true, result: result.rows[0] });
    } else {
      res.json({ attempted: false });
    }
  } catch (err) {
    console.error('Error fetching result:', err);
    res.status(500).json({ error: 'Failed to fetch result status' });
  }
});

// Create Exam / Assignment Endpoint
router.post('/create', async (req, res) => {
  const { title, duration_minutes, questions } = req.body;

  try {
    // 1. Validation
    if (!title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Title and Questions array are required.' });
    }

    // 2. Format questions as JSON string for DB
    const questionsJson = JSON.stringify(questions);
    const duration = duration_minutes || 60;

    // 3. PostgreSQL Query
    const queryText = `
      INSERT INTO exams (title, duration_minutes, questions)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const result = await pool.query(queryText, [title, duration, questionsJson]);

    res.status(201).json({
      message: 'Exam created successfully!',
      exam: result.rows[0]
    });

  } catch (err) {
    console.error('❌ Database Error while creating exam:', err);
    res.status(500).json({ 
      error: 'Database error while saving assignment', 
      details: err.message 
    });
  }
});

// Fetch All Exams Endpoint (For Student Dashboard)
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM exams ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching exams:', err);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});



// Delete Exam Route
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM exams WHERE id = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json({ message: 'Exam deleted successfully!', deletedExam: result.rows[0] });
  } catch (err) {
    console.error('❌ Delete Error:', err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;