import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onSwitchToStudent, onLogout }) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState([
    {
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'Option A'
    }
  ]);

  const [jsonInput, setJsonInput] = useState('');
  const [existingExams, setExistingExams] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch Existing Assignments on Load
  const fetchExams = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/exams/all');
      setExistingExams(res.data);
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // 🗑️ Delete Exam Handler
  const handleDeleteExam = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await axios.delete(`http://localhost:3000/api/exams/delete/${id}`);
        alert('Assignment deleted successfully!');
        fetchExams(); // List Refresh
      } catch (err) {
        console.error('Error deleting exam:', err);
        alert('Failed to delete assignment');
      }
    }
  };

  // Handle Dynamic Question Input Changes
  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  // Add Single Question Manually
  const addQuestionField = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'Option A'
      }
    ]);
  };

  // Remove Question Field
  const removeQuestionField = (index) => {
    if (questions.length === 1) {
      alert('At least one question is required!');
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  // 🚀 Flexible Fast Import via JSON
  const handleJsonImport = () => {
    try {
      if (!jsonInput.trim()) return;
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        const formattedQuestions = parsed.map((q) => ({
          question: q.question || q.question_text || q.title || q.q_text || q.text || '',
          option_a: q.option_a || q.optionA || q.a || '',
          option_b: q.option_b || q.optionB || q.b || '',
          option_c: q.option_c || q.optionC || q.c || '',
          option_d: q.option_d || q.optionD || q.d || '',
          correct_option: q.correct_option || q.correctOption || q.answer || 'Option A'
        }));

        setQuestions(formattedQuestions);
        setSuccess('JSON Questions imported successfully!');
        setJsonInput('');
        setError('');
      } else {
        setError('Invalid JSON format. Must be an array of questions.');
      }
    } catch (err) {
      setError('JSON Parse Error: Check your JSON syntax.');
    }
  };

  // Publish Assignment Handler
  const handlePublishAssignment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Please enter an Assignment Title!');
      return;
    }

    setLoading(true);

    const payload = {
      title: title.trim(),
      duration_minutes: parseInt(duration) || 60,
      questions: questions
    };

    try {
      await axios.post('http://localhost:3000/api/exams/create', payload);
      setSuccess('Assignment published successfully!');
      
      // Reset Form
      setTitle('');
      setDuration(60);
      setQuestions([
        {
          question: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_option: 'Option A'
        }
      ]);

      // Refresh Exams List
      fetchExams();
    } catch (err) {
      console.error('Publish error details:', err.response?.data || err);
      setError(err.response?.data?.error || err.response?.data?.details || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      
      {/* Header Bar */}
      <div className="admin-header">
        <div>
          <h2 className="admin-header-title">EduTrack Admin Portal</h2>
          <small className="admin-header-user">Logged in as Admin ({user?.name || user?.email})</small>
        </div>
        <div>
          {onSwitchToStudent && (
            <button
              onClick={onSwitchToStudent}
              className="btn-admin-nav"
            >
              🎓 View in Student Dashboard
            </button>
          )}
          <button
            onClick={onLogout}
            className="btn-admin-logout"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="admin-form-card">
        <h3 className="admin-form-title">➕ Create New Assignment</h3>

        {error && <div className="admin-alert-error">{error}</div>}
        {success && <div className="admin-alert-success">{success}</div>}

        <div className="form-row">
          <div className="col-title">
            <label className="form-label">Assignment Title:</label>
            <input
              type="text"
              placeholder="e.g. SSC CGL Tier 1 Full Mock"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="col-duration">
            <label className="form-label">Duration (Minutes):</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Fast Import Box */}
        <div className="import-box">
          <h4 className="import-title">Fast Import Questions via JSON</h4>
          <textarea
            rows="3"
            placeholder='[{"question":"Sample?","option_a":"A","option_b":"B","option_c":"C","option_d":"D","correct_option":"Option A"}]'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="import-textarea"
          />
          <button
            type="button"
            onClick={handleJsonImport}
            className="btn-import"
          >
            Import JSON Questions
          </button>
        </div>

        {/* Dynamic Questions List */}
        <h4>Questions ({questions.length})</h4>

        {questions.map((q, idx) => (
          <div key={idx} className="question-card">
            <div className="question-card-header">
              <strong className="question-number">Q{idx + 1}. Question & Options</strong>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestionField(idx)}
                  className="btn-remove-q"
                >
                  Remove
                </button>
              )}
            </div>

            <textarea
              rows="2"
              placeholder="Enter Question Text"
              value={q.question}
              onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)}
              className="question-textarea"
            />

            <div className="options-grid">
              <input
                type="text"
                placeholder="Option A"
                value={q.option_a}
                onChange={(e) => handleQuestionChange(idx, 'option_a', e.target.value)}
                className="option-input"
              />
              <input
                type="text"
                placeholder="Option B"
                value={q.option_b}
                onChange={(e) => handleQuestionChange(idx, 'option_b', e.target.value)}
                className="option-input"
              />
              <input
                type="text"
                placeholder="Option C"
                value={q.option_c}
                onChange={(e) => handleQuestionChange(idx, 'option_c', e.target.value)}
                className="option-input"
              />
              <input
                type="text"
                placeholder="Option D"
                value={q.option_d}
                onChange={(e) => handleQuestionChange(idx, 'option_d', e.target.value)}
                className="option-input"
              />
            </div>

            <div className="correct-option-row">
              <label className="correct-option-label">Correct Option:</label>
              <select
                value={q.correct_option}
                onChange={(e) => handleQuestionChange(idx, 'correct_option', e.target.value)}
                className="correct-option-select"
              >
                <option value="Option A">Option A</option>
                <option value="Option B">Option B</option>
                <option value="Option C">Option C</option>
                <option value="Option D">Option D</option>
              </select>
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button
            type="button"
            onClick={addQuestionField}
            className="btn-add-q"
          >
            + Add Single Question Manual
          </button>

          <button
            type="button"
            onClick={handlePublishAssignment}
            disabled={loading}
            className={`btn-publish ${loading ? 'btn-publish-loading' : ''}`}
          >
            {loading ? 'Publishing...' : '🏷️ Publish Assignment'}
          </button>
        </div>
      </div>

      {/* Existing Assignments Section with Delete Option */}
      <div className="existing-exams-container">
        <h3>📚 Existing Portal Assignments ({existingExams.length})</h3>
        {existingExams.length === 0 ? (
          <p className="empty-text">No assignments created yet.</p>
        ) : (
          <div className="existing-exams-list">
            {existingExams.map((exam) => {
              let qCount = 0;
              try {
                qCount = Array.isArray(exam.questions)
                  ? exam.questions.length
                  : JSON.parse(exam.questions || '[]').length;
              } catch (e) {
                qCount = 0;
              }

              return (
                <div 
                  key={exam.id} 
                  className="existing-exam-card"
                >
                  <div>
                    <h4 className="existing-exam-title">{exam.title}</h4>
                    <small className="existing-exam-meta">
                      Duration: {exam.duration_minutes || 60} mins | Questions: {qCount}
                    </small>
                  </div>

                  <div className="existing-exam-actions">
                    <span className="badge-active">
                      Active
                    </span>

                    {/* 🗑️ Delete Button */}
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="btn-delete-exam"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;