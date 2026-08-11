import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';
import log_out_btn from "../assets/log-out-outline.svg"
import person_circle from "../assets/person-circle-outline.svg"
import book from "../assets/book-open-text.svg"
import send from "../assets/send.svg"
import profile from "../assets/user-shield.svg"
import layout_dashboard from "../assets/layout-dashboard.svg"
import refresh from "../assets/refresh-cw.svg"
import book_check from "../assets/notepad-text.svg"
import correctper from "../assets/book-open-check.svg"
import wrongper from "../assets/circle-x.svg"
import productper from "../assets/square-dashed-kanban.svg"
import CircularProgress from '../components/chart/circleChart';
const Dashboard = ({ user, onStartExam, onSwitchToAdmin, onLogout }) => {
  console.log("dashboard",user);
  
  const [exams, setExams] = useState([]);
  const [userResults, setUserResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardView,setdashboardView]=useState('dashboard')
  const [noattemptedexams,setnoattemptedexams]=useState(0)
  const [correctans,setcorrectans]=useState(0)

  // Fetch Exams and User Attempt Results from Backend
  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/exams/all');
      
      let examList = [];
      if (Array.isArray(res.data)) {
        examList = res.data;
        setExams(examList);
      } else {
        setExams([]);
      }

      // Check user results for each exam if user is logged in
      if (user?._id && examList.length > 0) {
        const resultsMap = {};
        for (let exam of examList) {
          try {
            const checkRes = await axios.get(`http://localhost:3000/api/exams/result/${exam.id}/${user._id}`);
            if (checkRes.data.attempted) {
              resultsMap[exam.id] = checkRes.data.result;
            }
          } catch (e) {
            console.error(`Error fetching attempt for exam ${exam.id}:`, e);
          }
        }
        setUserResults(resultsMap);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching dashboard exams:', err);
      setError('Failed to load active exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    console.log(userResults);
    
  }, [user]);

  return (
    <div className="dashboard-container">
      
      {/* Top Navbar */}
      <div className='dashboard-left'>
      

      {/* Main Banner */}
      <div className={dashboardView==="dashboard"?'dashboard-item active':'dashboard-item'} onClick={()=>{setdashboardView("dashboard")}}>
        <h4>Dashboard</h4>
        <img src={layout_dashboard} alt="" />
      </div>
      <div className={dashboardView==="exams"?'dashboard-item active':'dashboard-item'} onClick={()=>{setdashboardView("exams")}}>
        <h4>Exams</h4>
        <img src={book}alt="" />
      </div>
      <div className={dashboardView==="submitted"?'dashboard-item active':'dashboard-item'} onClick={()=>{setdashboardView("submitted")}}>
        <h4>Submitted</h4>
        <img src={send} alt="" />
      </div>
      
      <div className={dashboardView==="myprofile"?'dashboard-item active':'dashboard-item'} onClick={()=>{setdashboardView("myprofile")}}>
        <h4>My Profile</h4>
        <img src={profile} alt="" />
      </div>
      <div className="dashboard-banner">
        <div>
          <p className="banner-title">EduTrack - CEC Portal</p>
          
        </div>
        <button 
          onClick={fetchExams}
          className="btn-refresh"
        >
          <img src={refresh} alt="" />
        </button>
      </div>
      <div className="dashboard-user-profile">
        <img className='person_circle' src={person_circle} alt="" />
        <div>
          <h4>{user.name}</h4>
          <p className='profile-email-show'>{user.email}</p>
        </div>
        <img className='log-ou-btn' src={log_out_btn} alt="" />
      </div>
      </div>

      {/* Exams Section */}
      <div className="exams-section">
        {
          dashboardView=="dashboard"?<div className="student-progress">
          <h3>Student Progress</h3>
          <div className='student-progress-box'>
          <div className='progress-boxes'>
            <div className='progress-box-img' style={{backgroundColor : "lightblue"}}>
            <img src={book_check} alt="" />

            </div>
            <div className='progress-box-info'>
            <p>Attempted exams</p>
            <p>0%</p>
            </div>
          </div>
          
          <div className='progress-boxes'>
            <div  className='progress-box-img'style={{backgroundColor : "lightgreen"}}>
            <img src={correctper} alt="" />

            </div>
            <div className='progress-box-info'>
            <p>Correct answers</p>
            <p>0%</p>

            </div>
          </div>
          <div className='progress-boxes'>
            <div  className='progress-box-img'style={{backgroundColor : "rgb(255, 146, 146)"}}>
            <img src={wrongper} alt="" />

            </div>
            <div className='progress-box-info'>
            <p>Wrong answers</p>
            <p>0%</p>

            </div>
          </div>
          <div className='progress-boxes'>
            <div  className='progress-box-img' style={{backgroundColor :"lightskyblue"}}>
            <img src={productper} alt="" />

            </div>
            <div className='progress-box-info'>
            <p>Productivity</p>
            <p>0%</p>

            </div>
          </div>
          </div>
          <CircularProgress percentage={0} totalMarksObtained={0} totalMaxMarks={exams.length}/>
          {/* <CircularProgress totalsubmittedexams={exams.length}/>
          <CircularProgress totalsubmittedexams={exams.length}/> */}

        </div>:""
        }
        
        {
          dashboardView==="dashboard" || dashboardView==="exams"?<div>
          <h3 className="section-title">
            Competitive Education Cell (CEC) Active Tests
          </h3>
  
          {loading && <p className="status-loading">Loading available exams...</p>}
          {error && <p className="status-error">{error}</p>}
  
          {!loading && !error && exams.length === 0 && (
            <p className="status-empty">
              No active exams available right now. Ask Admin to publish one!
            </p>
          )}
  
          {/* Exams Grid */}
          <div className="exams-grid">
            {exams.map((exam) => {
              let parsedQuestions = [];
              try {
                parsedQuestions = Array.isArray(exam.questions) 
                  ? exam.questions 
                  : JSON.parse(exam.questions || '[]');
              } catch (e) {
                parsedQuestions = [];
              }
  
              const result = userResults[exam.id];
              const isAttempted = !!result;
              
              
              return (
                <div 
                  key={exam.id} 
                  className={`exam-card ${isAttempted ? 'exam-card-attempted' : ''}`}
                >
                  <div>
                    <div className="exam-card-header">
                      <h4 className="exam-card-title">{exam.title}</h4>
                      {isAttempted && (
                        <span className="badge-completed">
                          ✅ Completed
                        </span>
                      )}
                    </div>
  
                    <div className="exam-info">
                      <p className="exam-info-text">⏱️ Duration: <b>{exam.duration_minutes || 60} mins</b></p>
                      <p className="exam-info-text">❓ Questions: <b>{parsedQuestions.length} Questions</b></p>
                      
                      {/* Display Attempt Score Status */}
                      {isAttempted && (
                        <p className="score-badge">
                          {console.log(result.score)
                          }
                          🎯 Score: {result.score} / {result.total_questions} ({result.percentage}%)
                        </p>
                      )}
                    </div>
                  </div>
  
                  <button
                    onClick={() => onStartExam && onStartExam(exam.id || exam)}
                    className={`btn-exam-action ${isAttempted ? 'btn-exam-view-stats' : 'btn-exam-start'}`}
                  >
                    {isAttempted ? '📊 View Statistics' : '🚀 Start Test Now'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>:""
        }
        {
          dashboardView==="myprofile"?<div className="user-details-card">

          <div className="user-details-header">
    
            <img
              src={
                user.profileImage ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
              }
              alt={user.name}
              className="user-details-avatar"
            />
    
            <h2>{user.name}</h2>
    
            <p>{user.collegeId}</p>
    
            <span className="user-role">
              {user.role || "Student"}
            </span>
    
          </div>
    
          <div className="user-details-info">
    
            <div className="user-detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user.email}</span>
            </div>
    
            <div className="user-detail-item">
              <span className="detail-label">Department</span>
              <span className="detail-value">{user.department}</span>
            </div>
    
            
    
            <div className="user-detail-item">
              <span className="detail-label">Section</span>
              <span className="detail-value">{user.section}</span>
            </div>
    
            <div className="user-detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value">
                {user.role || "Student"}
              </span>
            </div>
    
          </div>
    
        </div>:""
        }
        </div>

    </div>
  );
};

export default Dashboard;