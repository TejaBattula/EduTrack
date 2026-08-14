import React, { useState } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './Login.css';
import edutrack_icon from "../assets/graduation-cap.svg"
import adminSheild from "../assets/user-shield.svg"
import logo from "../assets/logo.jpeg"
import AdminDashboard from './AdminDashboard';
const ALLOWED_ADMIN_EMAILS = [
  
  "s221204@rguktsklm.ac.in","s221147@rguktsklm.ac.in","coordinator_hc@rguktsklm.ac.in","s220261@rguktsklm.ac.in"
];

const ALLOWED_DOMAIN = 'rguktsklm.ac.in';

const Login = ({ setUser }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    section: ''
  });
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading,setloading]=useState(false)
  const [registerationLoading,setRegistrationLoading]=useState(false)
  const [loginError,setloginerror]=useState('')
  const validateAndGetRole = (email) => {
    if (!email || !email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
      return null; // Invalid Domain
    }
    const isAdmin = ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
    return isAdmin ? 'admin' : 'student';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setloading(true)
    
    // 1. Email Domain Check
    const role = validateAndGetRole(formData.email);
    if (!role) {
      setError(`Access Restricted! Only @${ALLOWED_DOMAIN} email IDs are allowed.`);
      setloading(false);
      return;
    }

    const endpoint = isRegister 
      ? 'https://edutrack-cgpn.onrender.com/api/auth/register' 
      : 'https://edutrack-cgpn.onrender.com/api/auth/login';

    try {
        
      isRegister?setRegistrationLoading(true):setRegistrationLoading(false)
      const response = await fetch(isRegister?"https://edutrack-cgpn.onrender.com/signup":"https://edutrack-cgpn.onrender.com/login",{
        method : "POST",
        headers : {"Content-Type":"application/json"},
        body : JSON.stringify(formData)
      })
      const data = await response.json()
      
      if (!isRegister) {
       
        setUser(data.data);
        setloginerror(data.message)

      } else {
        alert('Registration Successful! Please login.');
        setIsRegister(false);
      }
      
    } catch (err) {
      setloading(false)
      setError(err.response?.data?.message || 'Something went wrong');
    }
    setloading(false)
    setRegistrationLoading(false)
  };

  

  return (
    <div className="login-container">
      
    {showAdmin ?
    <AdminDashboard
      user={formData}
      setUser={setUser}
      onSwitchToStudent={() => setShowAdmin(false)}
      onLogout={() => setShowAdmin(false)}
    />
    :
      <div className="login-card">
        <div>
          <div className='edutrackicon'>
            <img src={logo} alt="" width="20"/>
          </div>
        <h1 className="login-title">
          Competitive Exam Cell {isRegister ? 'Register' : 'Login'}
        </h1>
        
        <p className="login-subtitle">
          Only <b>@rguktsklm.ac.in</b> emails allowed
        </p>
        </div>

        {error && <p className="login-error">{error}</p>}
        {loginError!=''?<p className='login-error'>{loginError}</p>:""}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            
            <div className='form-field'>
              <p>Name</p>
              <input
              type="text"
              placeholder="Full Name"
              required
              className="login-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            </div>
          )}
          <div className='form-field'>
            <p>Email Address</p>
          <input
            type="email"
            placeholder="yourid@rguktsklm.ac.in"
            required
            className="login-input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
          />
          </div>
         <div className='form-field'>
          <p>Password</p>
         <input
            type="password"
            placeholder="Password"
            required
            className="login-input login-input-password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
         </div>
         {
          isRegister?
          <><div className="form-field">
          <p>Department</p>
          <select
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            required
          >
            <option value="">Select Department</option>
            <option value="CSE">Computer Science and Engineering</option>
            <option value="ECE">Electronics and Communication Engineering</option>
            <option value="EEE">Electrical and Electronics Engineering</option>
            <option value="MECH">Mechanical Engineering</option>
            <option value="CIVIL">Civil Engineering</option>
          </select>
        </div>
        
        <div className="form-field">
          <p>Section</p>
          <select
            value={formData.section}
            onChange={(e) =>
              setFormData({ ...formData, section: e.target.value })
            }
            required
          >
            <option value="">Select Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>
        </div>
         </>:""
         }
          <button type="submit" className="login-submit-btn">
            {isRegister ? registerationLoading===true?<p><span className='spinner'></span>Please wait</p>:'Register' : loading===true?"Authenticating please wait...":"Login"}
          </button>
        </form>


        {/* Real Official Google OAuth Button */}
        
       
        <p className="login-toggle-link" onClick={() => { setError(''); setIsRegister(!isRegister); }}>
          {isRegister ? <span>Already have an account? <span>Login</span></span> : <span>Don't have an account? <span>Register</span></span>}
        </p>
      </div>}
    </div>
  );
};

export default Login;