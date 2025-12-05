import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ClipboardList, GitBranch, Save, RefreshCw, Search, CheckCircle, Moon, Loader, AlertTriangle, Clock } from 'lucide-react';
import '../styles/Login.css';

function Login() {
    const { login, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const error = searchParams.get('error');
    const [serverStatus, setServerStatus] = useState('unknown'); // 'unknown' | 'checking' | 'awake' | 'sleeping'

    const checkServerHealth = async () => {
        setServerStatus('checking');
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for cold starts

            const response = await fetch('https://airtabledynamicform.onrender.com/', {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                setServerStatus('awake');
            } else {
                setServerStatus('sleeping');
            }
        } catch (err) {
            setServerStatus('sleeping');
        }
    };

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
                            <span className="feature-icon"><ClipboardList size={24} /></span>
                            <span>Create custom forms from Airtable fields</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon"><GitBranch size={24} /></span>
                            <span>Add conditional logic to show/hide questions</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon"><Save size={24} /></span>
                            <span>Save responses to Airtable automatically</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon"><RefreshCw size={24} /></span>
                            <span>Keep data synced with webhooks</span>
                        </div>
                    </div>

                    <button
                        className={`server-status-button ${serverStatus}`}
                        onClick={checkServerHealth}
                        disabled={serverStatus === 'checking'}
                    >
                        {serverStatus === 'unknown' && (
                            <>
                                <Search size={18} />
                                Check Server Status
                            </>
                        )}
                        {serverStatus === 'checking' && (
                            <>
                                <Loader size={18} className="spinning" />
                                Waking Up Server... Please wait
                            </>
                        )}
                        {serverStatus === 'awake' && (
                            <>
                                <CheckCircle size={18} />
                                Server is Awake
                            </>
                        )}
                        {serverStatus === 'sleeping' && (
                            <>
                                <Moon size={18} />
                                Server is Sleeping - Click to Wake
                            </>
                        )}
                    </button>

                    {serverStatus !== 'awake' && (
                        <p className="server-hint">
                            {serverStatus === 'checking'
                                ? <><Clock size={14} /> Please wait while the server wakes up (may take 30-60 seconds)...</>
                                : <><AlertTriangle size={14} /> Please check server status before logging in</>}
                        </p>
                    )}

                    <button
                        className="login-button"
                        onClick={login}
                        disabled={serverStatus !== 'awake'}
                    >
                        <svg className="airtable-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1 5v5H6v2h5v5h2v-5h5v-2h-5V7h-2z" />
                        </svg>
                        {serverStatus === 'awake' ? 'Login with Airtable' : 'Check Server First ↑'}
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
