import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ExamScreen.css';

const ExamScreen = ({ user, examId, setExamId }) => {
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [stats, setStats] = useState(null);

  const [timeLeft, setTimeLeft] = useState(3600);
  
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  const isSubmittedRef = useRef(isSubmitted);
  const userAnswersRef = useRef(userAnswers);
  const questionsRef = useRef(questions);

  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
    userAnswersRef.current = userAnswers;
    questionsRef.current = questions;
  }, [isSubmitted, userAnswers, questions]);

  const parseQuestionsData = (examData) => {
    let qData = [];
    if (typeof examData.questions === 'string') {
      try {
        qData = JSON.parse(examData.questions || '[]');
      } catch (e) {
        qData = [];
      }
    } else if (Array.isArray(examData.questions)) {
      qData = examData.questions;
    }
    return qData;
  };

  useEffect(() => {
    
    
    const fetchExamData = async () => {
      try {
        setLoading(true);

        let examRes;
        try {
          examRes = await axios.get(`https://edutrack-cgpn.onrender.com/api/exams/${examId}`);
        } catch (e) {
          const allRes = await axios.get('https://edutrack-cgpn.onrender.com/api/exams/all');
          const found = allRes.data.find((exam) => String(exam.id) === String(examId));
          examRes = { data: found };
        }

        const examData = examRes.data;
        if (examData) {
          setExam(examData);
          const qData = parseQuestionsData(examData);
          setQuestions(qData);

          const durationSeconds = (examData.duration_minutes || 60) * 60;
          setTimeLeft(durationSeconds);
        }

        // Check Previous Attempt
        if (user?._id) {
          try {
            const checkRes = await axios.get(
              `https://edutrack-cgpn.onrender.com/api/exams/result/${examId}/${user._id}`
            );
        
        
            
            if (checkRes.data.attempted) {
                  const prev = checkRes.data.result;

                  console.log("PREVIOUS RESULT:", prev);

                  setStats({
                    score: Number(prev.score ?? 0),

                    totalQuestions: Number(
                      prev.total_questions ??
                      prev.totalQuestions ??
                      questions.length
                    ),

                    percentage: Number(prev.percentage ?? 0)
                  });

                  if (prev.userAnswers || prev.user_answers) {
                    setUserAnswers(
                      prev.userAnswers ||
                      prev.user_answers ||
                      {}
                    );
                  }

                  setIsSubmitted(true);
                  setLoading(false);
                  return;
                }
          } catch (err) {
            console.error('Error checking previous attempt:', err);
          }
        }
      } catch (err) {
        console.error('Error loading exam details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamData();
      
    }
  }, [examId, user]);

  const handleSubmitExam = async (isAutoSubmit = false, reason = '') => {
    if (submitting || isSubmittedRef.current) return;
  
    if (!isAutoSubmit) {
      if (!window.confirm('Are you sure you want to submit the exam?')) {
        return;
      }
    } else if (reason) {
      alert(reason);
    }
  
    setSubmitting(true);
  
    const answersToSubmit = userAnswersRef.current;
    const currentQuestions = questionsRef.current;
  
    try {
      const payload = {
        name : user.name,
        userEmail : user.email,
        department : user.department,
        examName : exam?.title,
        userId: user?._id || user?.id,
        examId: examId,
        userAnswers: answersToSubmit,
        questions: currentQuestions
      };
  
      console.log(payload);
      
      const response = await fetch(
        "https://edutrack-cgpn.onrender.com/submitexam",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );
  
      const data = await response.json();
  
      
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit exam");
      }
  
      if (data.data?.stats) {
        setStats({
          score: data.data.stats.score,
          totalQuestions: data.data.stats.totalQuestions,
          percentage: data.data.stats.percentage
        });
      } else {
        let calculatedScore = 0;
  
        currentQuestions.forEach((q, index) => {
          const selected = answersToSubmit[index];
  
          const correct =
            q.correct_option ||
            q.answer;
  
          if (
            selected &&
            correct &&
            selected.trim().toLowerCase() ===
              correct.trim().toLowerCase()
          ) {
            calculatedScore += 1;
          }
        });
  
        const total = currentQuestions.length;
  
        setStats({
          score: calculatedScore,
          totalQuestions: total,
          percentage:
            total > 0
              ? ((calculatedScore / total) * 100).toFixed(2)
              : 0
        });
      }
  
      setIsSubmitted(true);
  
    } catch (err) {
      console.error("Submit Exam Error:", err);
      alert("Error submitting exam!");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (loading || isSubmitted || !exam) return;

    const timerInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerInterval);
          handleSubmitExam(true, '⏱️ Time is up! Your exam has been automatically submitted.');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [loading, isSubmitted, exam]);

  useEffect(() => {
    if (loading || isSubmitted || !exam) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prevCount) => {
          const newCount = prevCount + 1;
          if (newCount === 1) {
            setShowWarning(true);
          } else if (newCount >= 2) {
            handleSubmitExam(true, ' You switched tabs again! Exam is automatically submitted due to violation.');
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, isSubmitted, exam]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionValue) => {
    setUserAnswers({
      ...userAnswers,
      [currentQIndex]: optionValue,
    });
  };

  // Normalization helper for accurate comparison between selections & correct key
  const normalizeKey = (keyStr) => {
    if (!keyStr) return '';
    const clean = String(keyStr).trim().toLowerCase();
    if (clean.includes('a') && clean.length <= 8) return 'Option A';
    if (clean.includes('b') && clean.length <= 8) return 'Option B';
    if (clean.includes('c') && clean.length <= 8) return 'Option C';
    if (clean.includes('d') && clean.length <= 8) return 'Option D';
    return keyStr;
  };

  if (loading) {
    return (
      <div className="exam-screen-loading">
        ⏳ Loading Exam Details...
      </div>
    );
  }

  
  if (isSubmitted && stats) {
            const totalQuestions = Number(
          stats?.totalQuestions ?? questions.length ?? 0
        );

        const score = Number(
          stats?.score ?? 0
        );

        const wrongAnswers = Math.max(
          0,
          totalQuestions - score
        );

    return (
      <div className="results-card">
        <h2 className="results-title">🎉 Exam Performance Details</h2>
        <p className="results-subtitle">Here are your statistics and answer key breakdown:</p>
        
        {/* Score Card Banner */}
        <div className="results-stats-grid">
          <div className="stat-box">
            <span className="stat-box-title">FINAL SCORE</span>
            <div className="stat-score-val">
              {score} / {totalQuestions}
            </div>
          </div>

          <div className="stat-box">
            <span className="stat-box-title">ACCURACY</span>
            <div className="stat-accuracy-val">
              {stats.percentage}%
            </div>
          </div>

          <div className="stat-box-correct">
            <span className="stat-box-correct-title">Correct Answers</span>
            <div className="stat-box-correct-val">{score}</div>
          </div>

          <div className="stat-box-wrong">
            <span className="stat-box-wrong-title">Wrong / Unanswered</span>
            <div className="stat-box-wrong-val">{wrongAnswers}</div>
          </div>
        </div>

        <div className="review-section" style={{ marginTop: '30px', textAlign: 'left' }}>
          <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
            📝 Question Breakdown & Answers
          </h3>

          {questions.map((q, idx) => {
            const userChoice = userAnswers[idx];
            const correctRaw = q.correct_option || q.answer;
            
            const normalizedUser = normalizeKey(userChoice);
            const normalizedCorrect = normalizeKey(correctRaw);

            const optionsMap = [
              { key: 'Option A', text: q.option_a || q.options?.[0] },
              { key: 'Option B', text: q.option_b || q.options?.[1] },
              { key: 'Option C', text: q.option_c || q.options?.[2] },
              { key: 'Option D', text: q.option_d || q.options?.[3] },
            ];

            return (
              <div 
                key={idx} 
                className="review-question-card"
                style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  borderLeft: normalizedUser === normalizedCorrect && userChoice 
                    ? '5px solid #22c55e' 
                    : userChoice ? '5px solid #ef4444' : '5px solid #e2e8f0'
                }}
              >
                <h4 style={{ margin: '0 0 12px 0' }}>
                  Q{idx + 1}. {q.question || q.title}
                </h4>

                <div className="review-options-list">
                  {optionsMap.map((opt) => {
                    if (!opt.text) return null;

                    const isUserChosen = normalizedUser === opt.key || userChoice === opt.text;
                    const isCorrect = normalizedCorrect === opt.key || correctRaw === opt.text;

                    let optionBg = '#ffffff';
                    let optionBorder = '1px solid #cbd5e1';
                    let labelTag = null;

                    if (isCorrect) {
                      optionBg = '#dcfce7';
                      optionBorder = '1px solid #22c55e';
                      labelTag = <span style={{ color: '#15803d', fontWeight: 'bold', marginLeft: '10px' }}>✓ Correct Answer</span>;
                    }

                    if (isUserChosen && !isCorrect) {
                      optionBg = '#fee2e2';
                      optionBorder = '1px solid #ef4444';
                      labelTag = <span style={{ color: '#b91c1c', fontWeight: 'bold', marginLeft: '10px' }}>✕ Your Choice</span>;
                    } else if (isUserChosen && isCorrect) {
                      labelTag = <span style={{ color: '#15803d', fontWeight: 'bold', marginLeft: '10px' }}>✓ Your Choice (Correct)</span>;
                    }

                    return (
                      <div
                        key={opt.key}
                        style={{
                          padding: '10px 14px',
                          margin: '6px 0',
                          borderRadius: '6px',
                          background: optionBg,
                          border: optionBorder,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong>{opt.key}:</strong> {opt.text}
                        </div>
                        {labelTag}
                      </div>
                    );
                  })}
                </div>

                {!userChoice && (
                  <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '8px' }}>
                    ⚠️ You did not attempt this question.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setExamId(null)}
          className="btn-return-dashboard"
          style={{ marginTop: '20px' }}
        >
          ⬅️ Return to Dashboard
        </button>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="exam-not-found">
        <h3>Exam details or questions not found!</h3>
        <button onClick={() => setExamId(null)} className="btn-back-dashboard">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  
  const optionsMap = [
    { key: 'Option A', text: currentQ.option_a || currentQ.options?.[0] },
    { key: 'Option B', text: currentQ.option_b || currentQ.options?.[1] },
    { key: 'Option C', text: currentQ.option_c || currentQ.options?.[2] },
    { key: 'Option D', text: currentQ.option_d || currentQ.options?.[3] },
  ];

  return (
    <div className="exam-container">
      {/* 🚨 Tab Switch Warning Modal */}
      {showWarning && (
        <div className="warning-overlay">
          <div className="warning-modal">
            <h3 className="warning-modal-title">⚠️ WARNING!</h3>
            <p className="warning-modal-text">
              You switched tabs or minimized the window. Switching tabs is strictly prohibited!
            </p>
            <p className="warning-modal-danger">
              If you switch tabs one more time, your exam will be automatically SUBMITTED!
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="btn-warning-dismiss"
            >
              I Understand, Continue Exam
            </button>
          </div>
        </div>
      )}

      {/* Top Bar with Timer */}
      <div className="exam-header">
        <div>
          <h2 className="exam-header-title">{exam.title}</h2>
          <small className="exam-header-sub">Question {currentQIndex + 1} of {questions.length}</small>
        </div>

        {/* ⏱️ Live Timer Banner */}
        <div className={`exam-timer ${timeLeft < 300 ? 'timer-warning' : ''}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Box */}
      <div className="exam-question-card">
        <h3 className="exam-question-text">{currentQ?.question || currentQ?.title}</h3>

        <div className="options-list">
          {optionsMap.map((opt) => {
            if (!opt.text) return null;
            const isSelected = userAnswers[currentQIndex] === opt.key;

            return (
              <button
                key={opt.key}
                onClick={() => handleOptionSelect(opt.key)}
                className={`option-btn ${isSelected ? 'option-btn-selected' : ''}`}
              >
                <strong>{opt.key}:</strong> {opt.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="exam-nav-bar">
        <button
          disabled={currentQIndex === 0}
          onClick={() => setCurrentQIndex((prev) => prev - 1)}
          className="btn-nav-prev"
        >
           Previous
        </button>

        {currentQIndex === questions.length - 1 ? (
          <button
            onClick={() => handleSubmitExam(false)}
            disabled={submitting}
            className={`btn-submit-exam ${submitting ? 'btn-submitting' : ''}`}
          >
            {submitting ? 'Submitting...' : ' Submit Test'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentQIndex((prev) => prev + 1)}
            className="btn-nav-next"
          >
            Next ➡️
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamScreen;