import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamScreen from './pages/ExamScreen';
import LoginScreen from "./pages/Login";
import './App.css';
import logo from "/home/user/Desktop/Edutrack/edutrack-frontend/src/assets/logo.jpeg"
// 🎯 Allowed Admin Email Constant
const ADMIN_EMAIL = "s221204@rguktsklm.ac.in";

function App() {
  // Initially user null (Logged Out State)
  const [user, setUser] = useState(null); 
  const [activeExamId, setActiveExamId] = useState(null);

  // 1. User Logged In లేకపోతే Login Page ని మాత్రమే చూపించు
  if (!user) {
    return <LoginScreen setUser={setUser} />;
  }

  // Helper function: Dashboard నుండి Exam Start చేసినప్పుడు Call అవుతుంది
  const handleStartExam = (exam) => {
    const id = typeof exam === 'object' ? exam.id : exam;
    setActiveExamId(id);
  };

  // Check if current user is the authorized admin
  const isAdminUser = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // 2. User Logged In అయిన తర్వాత Dashboard & App UI
  return (
    <div className="app-container">
      
      {/* Top Navigation Bar */}
      <div className="app-navbar">
        <div>
         <div className='edutrack-head'>
         <div className='edutrack-icon'>
            <img src={logo} alt="" />
          </div>
          <span className="app-title">Competitive Exam Cell</span>
          
         </div>
          
        </div>
        
        <div className="app-nav-buttons">
          <button 
            onClick={() => {
              setActiveExamId(null);
              setUser((prev) => ({ ...prev, role: 'student' }));
            }}
            className={`btn-nav ${user.role === 'student' && !activeExamId ? 'btn-nav-active' : ''}`}
          >
            Student Dashboard
          </button>

          {/* 🔒 Show Admin Panel Button ONLY if logged in email is s221204@rguktsklm.ac.in */}
          {isAdminUser && (
            <button 
              onClick={() => {
                setActiveExamId(null);
                setUser((prev) => ({ ...prev, role: 'admin' }));
              }}
              className={`btn-nav ${user.role === 'admin' ? 'btn-admin-active' : ''}`}
            >
               Admin Panel
            </button>
          )}

          <button 
            onClick={() => {
              setActiveExamId(null);
              setUser(null); // Logout action
            }}
            className="btn-nav btn-logout"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Dynamic Screen Switching with Security Gate */}
      {activeExamId ? (
        <ExamScreen user={user} examId={activeExamId} setExamId={setActiveExamId} />
      ) : (user?.role === 'admin' && isAdminUser) ? (
        <AdminDashboard user={user} setUser={setUser} setActiveExamId={setActiveExamId} />
      ) : (
        <Dashboard 
          user={user} 
          setUser={setUser} 
          onStartExam={handleStartExam} 
          setExamId={handleStartExam} 
          onSwitchToAdmin={
            isAdminUser ? () => setUser((prev) => ({ ...prev, role: 'admin' })) : null
          }
          onLogout={() => setUser(null)}
        />
      )}

    </div>
  );
}

export default App;