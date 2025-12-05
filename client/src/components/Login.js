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
            padding: '15px', 
            marginBottom: '15px', 
            backgroundColor: '#fee', 
            color: '#c33', 
            borderRadius: '4px',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            <strong>Authentication Error:</strong>
            <div style={{ marginTop: '8px' }}>{error}</div>
            {(error.includes('OAuth Application Configuration Required') || 
              error.includes('failed to properly construct a request') ||
              error.includes('access_denied')) && (
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ccc' }}>
                <strong>How to fix:</strong>
                <ol style={{ marginTop: '8px', marginLeft: '20px', paddingLeft: '0' }}>
                  <li>Go to <a href="https://www.airtable.com/create/oauth" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>Airtable OAuth Settings</a></li>
                  <li>Find your OAuth application with Client ID: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>a05ee314-140e-45f6-acb0-77b13c511119</code></li>
                  <li><strong>CRITICAL:</strong> Click "Save" or "Update" at the bottom of the page (even if you haven't changed anything)</li>
                  <li>Verify the Redirect URI matches <strong>exactly</strong>: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>http://localhost:5000/api/auth/airtable/callback</code>
                    <ul style={{ marginTop: '5px', marginLeft: '20px' }}>
                      <li>No trailing slash</li>
                      <li>Must be <code>http</code> (not <code>https</code>) for localhost</li>
                      <li>Case-sensitive</li>
                    </ul>
                  </li>
                  <li><strong>IMPORTANT:</strong> Make sure you're logged into Airtable with the <strong>same account</strong> that created the OAuth app (development apps can only be authorized by the creator)</li>
                  <li>Wait 1-2 minutes after saving for Airtable to propagate changes</li>
                  <li>Try logging in again</li>
                </ol>
                <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '12px', border: '1px solid #ffc107' }}>
                  <strong>⚠️ Common Issue:</strong> If you're still getting this error, the OAuth app might need to be re-created. Development apps are restricted to the creator's account only.
                </div>
                <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '12px' }}>
                  <strong>💡 Tip:</strong> Visit <code style={{ backgroundColor: '#fff', padding: '2px 6px', borderRadius: '3px' }}>http://localhost:5000/api/auth/config/validate</code> to verify your configuration
                </div>
              </div>
            )}
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

