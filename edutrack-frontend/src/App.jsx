import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamScreen from './pages/ExamScreen';
import LoginScreen from "./pages/Login";
import './App.css';
import user_sheild from "./assets/shield-user.svg"
import logo from "./assets/logo.jpeg";
const ADMIN_EMAILS = [
  "s221204@rguktsklm.ac.in",
  "s221147@rguktsklm.ac.in",
  "coordinator_hc@rguktsklm.ac.in",
  "s220261@rguktsklm.ac.in"
].map(email => email.toLowerCase());

function App() {
  const [user, setUser] = useState(null); 
  const [activeExamId, setActiveExamId] = useState(null);
  const [navbar,setNavbar]=useState(false)
  if (!user) {
    return <LoginScreen setUser={setUser} />;
  }

  const handleStartExam = (exam) => {
    const id = typeof exam === 'object' ? exam.id : exam;
    setActiveExamId(id);
  };

  const isAdminUser = ADMIN_EMAILS.includes(user?.email?.toLowerCase());


  return (
    <div className="app-container">
      
      <div className="app-navbar">
        <div>
         <div className='edutrack-head'>
         <ion-icon className="menu" name="menu-outline" onClick={()=>{
          setNavbar(!navbar)
         }}></ion-icon>
         <div className='edutrack-icon'>
            <img src={logo} alt="" />
          </div>
          <span className="app-title">Competitive Exam Cell</span>
          
         </div>
          
        </div>
        
        <div className="app-nav-buttons">
          {window.innerWidth<678?<ion-icon name="person-outline"
          onClick={() => {
            setActiveExamId(null);
            setUser((prev) => ({ ...prev, role: 'student' }));
          }}
          ></ion-icon>:<button 
            onClick={() => {
              setActiveExamId(null);
              setUser((prev) => ({ ...prev, role: 'student' }));
            }}
            className={`btn-nav ${user.role === 'student' && !activeExamId ? 'btn-nav-active' : ''}`}
          >
            Student Dashboard
          </button>}

          
          {isAdminUser && (
            window.innerWidth<678?<img src={user_sheild} alt='' width="25"
            onClick={() => {
              setActiveExamId(null);
              setUser((prev) => ({ ...prev, role: 'admin' }));
            }}
            />:
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

          {window.innerWidth<678?<ion-icon name="log-out-outline"
          onClick={() => {
            setActiveExamId(null);
            setUser(null); 
          }}
          ></ion-icon>:<button 
            onClick={() => {
              setActiveExamId(null);
              setUser(null); 
            }}
            className="btn-nav btn-logout"
          >
            Logout
          </button>}
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
          navbar={navbar}
        />
      )}

    </div>
  );
}

export default App;