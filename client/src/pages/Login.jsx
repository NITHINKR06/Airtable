import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ClipboardList, GitBranch, Save, RefreshCw, Search, CheckCircle, Moon, Loader, AlertTriangle, Clock } from 'lucide-react';

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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-12 flex flex-col items-center">
                    <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const getServerButtonClasses = () => {
        const base = "w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-lg font-semibold text-sm transition-all duration-200 border-2";
        if (serverStatus === 'awake') {
            return `${base} bg-green-50 border-green-300 text-green-800 hover:bg-green-100`;
        } else if (serverStatus === 'sleeping') {
            return `${base} bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100`;
        } else if (serverStatus === 'checking') {
            return `${base} bg-blue-50 border-blue-300 text-blue-800 cursor-not-allowed opacity-70`;
        }
        return `${base} bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-10 md:p-12">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Airtable Form Builder</h1>
                    <p className="text-gray-600 text-sm">Create dynamic forms connected to your Airtable bases</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-6 text-sm font-medium">
                        {error === 'session_expired' && 'Your session has expired. Please log in again.'}
                        {error === 'auth_failed' && 'Authentication failed. Please try again.'}
                        {error === 'callback_failed' && 'Login failed. Please try again.'}
                        {!['session_expired', 'auth_failed', 'callback_failed'].includes(error) &&
                            `Error: ${error}`}
                    </div>
                )}

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                            <span className="text-indigo-600 flex-shrink-0"><ClipboardList size={24} /></span>
                            <span className="text-gray-700 text-sm">Create custom forms from Airtable fields</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                            <span className="text-indigo-600 flex-shrink-0"><GitBranch size={24} /></span>
                            <span className="text-gray-700 text-sm">Add conditional logic to show/hide questions</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                            <span className="text-indigo-600 flex-shrink-0"><Save size={24} /></span>
                            <span className="text-gray-700 text-sm">Save responses to Airtable automatically</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                            <span className="text-indigo-600 flex-shrink-0"><RefreshCw size={24} /></span>
                            <span className="text-gray-700 text-sm">Keep data synced with webhooks</span>
                        </div>
                    </div>

                    <button
                        className={getServerButtonClasses()}
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
                                <Loader size={18} className="animate-spin" />
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
                        <p className={`flex items-center justify-center gap-1.5 text-xs p-2.5 rounded-md ${
                            serverStatus === 'checking' 
                                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                        }`}>
                            {serverStatus === 'checking'
                                ? <><Clock size={14} /> Please wait while the server wakes up (may take 30-60 seconds)...</>
                                : <><AlertTriangle size={14} /> Please check server status before logging in</>}
                        </p>
                    )}

                    <button
                        className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                        onClick={login}
                        disabled={serverStatus !== 'awake'}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1 5v5H6v2h5v5h2v-5h5v-2h-5V7h-2z" />
                        </svg>
                        {serverStatus === 'awake' ? 'Login with Airtable' : 'Check Server First ↑'}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-xs leading-relaxed">By logging in, you authorize this app to access your Airtable data.</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
