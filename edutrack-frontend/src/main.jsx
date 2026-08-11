import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';
// react-router-dom not installed; routing handled via state
// Paste your copied Client ID inside quotes below:
const GOOGLE_CLIENT_ID = "563607928334-olmn76tu488ga9ph5pn49qv5un1dtdda.apps.googleusercontent.com"; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>,
);
