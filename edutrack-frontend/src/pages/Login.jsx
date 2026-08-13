import React, { useState } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './Login.css';
import edutrack_icon from "../assets/graduation-cap.svg"
import adminSheild from "../assets/user-shield.svg"
import logo from "/home/user/Desktop/Edutrack/edutrack-frontend/src/assets/logo.jpeg"
import AdminDashboard from './AdminDashboard';
// 👑 Specific Allowed Admin Mails
const ALLOWED_ADMIN_EMAILS = [
  // Nee Admin Email ikkada undali
  'admin@rguktsklm.ac.in',
  'director@rguktsklm.ac.in'
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
  // const navigate = useNavigate()
  // Domain & Role Validation Helper
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
    console.log(formData);
    
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
      // const res = await axios.post(endpoint, { ...formData, role });
      console.log("formdata login",formData);
      const response = await fetch(isRegister?"https://edutrack-cgpn.onrender.com/signup":"https://edutrack-cgpn.onrender.com/login",{
        method : "POST",
        headers : {"Content-Type":"application/json"},
        body : JSON.stringify(formData)
      })
      const data = await response.json()
      // console.log(data.message);
      
      if (!isRegister) {
        // const userData = { ...res.data.user, role: res.data.user?.role || role };
        // localStorage.setItem('user', JSON.stringify(userData));
        // localStorage.setItem('token', res.data.token);
        setUser(data.data);

      } else {
        alert('Registration Successful! Please login.');
        setIsRegister(false);
      }
      
    } catch (err) {
      // console.log(formData);
      setloading(false)
      setError(err.response?.data?.message || 'Something went wrong');
    }
    setloading(false)
  };

  // Official Google Login Success
  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const decodedUser = jwtDecode(credentialResponse.credential);
      const userEmail = decodedUser.email;

      // 1. Check if email ends with @rguktsklm.ac.in
      const role = validateAndGetRole(userEmail);
      if (!role) {
        setError(`Access Denied! Only @${ALLOWED_DOMAIN} Google accounts are allowed.`);
        return;
      }

      // 2. Prepare User Object with Role
      const realGoogleUser = {
        id: decodedUser.sub,
        name: decodedUser.name,
        email: userEmail,
        picture: decodedUser.picture,
        role: role // 'admin' or 'student'
      };

      localStorage.setItem('user', JSON.stringify(realGoogleUser));
      setUser(realGoogleUser);
    } catch (err) {
      setError('Failed to parse Google Login details.');
    }
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
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            {isRegister ? 'Register' : loading===true?"Authenticating please wait...":"Login"}
          </button>
        </form>

        <div className="login-divider">OR</div>

        {/* Real Official Google OAuth Button */}
        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-In Failed')}
          />
        </div>
       
        <p className="login-toggle-link" onClick={() => { setError(''); setIsRegister(!isRegister); }}>
          {isRegister ? <span>Already have an account? <span>Login</span></span> : <span>Don't have an account? <span>Register</span></span>}
        </p>
      </div>}
    </div>
  );
};

export default Login;