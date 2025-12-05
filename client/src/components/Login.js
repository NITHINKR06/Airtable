import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // Check for error in URL parameters
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clear the error from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  const handleLogin = () => {
    // Clear any previous errors
    setError(null);
    
    // Get base URL and ensure it doesn't have trailing slash
    let baseURL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    
    // If baseURL already includes /api, just append /auth/airtable
    // Otherwise, append /api/auth/airtable
    const authPath = baseURL.endsWith('/api') ? '/auth/airtable' : '/api/auth/airtable';
    
    // Redirect to backend OAuth endpoint
    window.location.href = `${baseURL}${authPath}`;
  };

  React.useEffect(() => {
    // Check if user is already logged in
    api.get('/auth/me')
      .then(() => {
        navigate('/dashboard');
      })
      .catch(() => {
        // Not logged in, stay on login page
      });
  }, [navigate]);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Airtable Form Builder</h1>
        <p>Connect your Airtable account to get started</p>
        {error && (
          <div className="error-message" style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            backgroundColor: '#fee', 
            color: '#c33', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        <button className="btn btn-primary" onClick={handleLogin}>
          Login with Airtable
        </button>
      </div>
    </div>
  );
}

export default Login;

