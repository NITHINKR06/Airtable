import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import '../styles/Login.css';

function Login() {
    const { login, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const error = searchParams.get('error');

    useEffect(() => {
        if (isAuthenticated && !loading) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, loading, navigate]);

    if (loading) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Airtable Form Builder</h1>
                    <p>Create dynamic forms connected to your Airtable bases</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error === 'session_expired' && 'Your session has expired. Please log in again.'}
                        {error === 'auth_failed' && 'Authentication failed. Please try again.'}
                        {error === 'callback_failed' && 'Login failed. Please try again.'}
                        {!['session_expired', 'auth_failed', 'callback_failed'].includes(error) &&
                            `Error: ${error}`}
                    </div>
                )}

                <div className="login-content">
                    <div className="features-list">
                        <div className="feature">
                            <span className="feature-icon">📋</span>
                            <span>Create custom forms from Airtable fields</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🔀</span>
                            <span>Add conditional logic to show/hide questions</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">💾</span>
                            <span>Save responses to Airtable automatically</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🔄</span>
                            <span>Keep data synced with webhooks</span>
                        </div>
                    </div>

                    <button className="login-button" onClick={login}>
                        <svg className="airtable-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1 5v5H6v2h5v5h2v-5h5v-2h-5V7h-2z" />
                        </svg>
                        Login with Airtable
                    </button>
                </div>

                <div className="login-footer">
                    <p>By logging in, you authorize this app to access your Airtable data.</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
