const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Configs & Routes
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Main API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('EduTrack Backend API Running Successfully!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});