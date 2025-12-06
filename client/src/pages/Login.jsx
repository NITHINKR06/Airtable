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
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-[2px] relative z-10">
                <div className="w-12 h-12 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 text-sm">Loading...</p>
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
        <div className="min-h-screen flex items-center justify-center p-5 relative z-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
                {/* Header Section with Gradient */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <ClipboardList size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Airtable Form Builder</h1>
                    <p className="text-indigo-100 text-sm">Create dynamic forms connected to your Airtable bases</p>
                </div>

                {/* Important Notice Banner */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 mx-6 mt-6 rounded-r-lg">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            <AlertTriangle size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-800 text-sm mb-1">Important: Airtable Account Required</h3>
                            <p className="text-amber-700 text-xs leading-relaxed">
                                First, create an account on <a href="https://airtable.com/signup" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-amber-900 transition-colors">Airtable.com</a>, then you can login here using the same email or account.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-4">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-5 text-sm font-medium">
                            {error === 'session_expired' && 'Your session has expired. Please log in again.'}
                            {error === 'auth_failed' && 'Authentication failed. Please try again.'}
                            {error === 'callback_failed' && 'Login failed. Please try again.'}
                            {!['session_expired', 'auth_failed', 'callback_failed'].includes(error) &&
                                `Error: ${error}`}
                        </div>
                    )}

                    <div className="flex flex-col gap-5">
                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                <span className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                    <ClipboardList size={20} />
                                </span>
                                <span className="text-gray-700 text-xs text-center font-medium">Custom Forms</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                <span className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                    <GitBranch size={20} />
                                </span>
                                <span className="text-gray-700 text-xs text-center font-medium">Conditional Logic</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                <span className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                    <Save size={20} />
                                </span>
                                <span className="text-gray-700 text-xs text-center font-medium">Auto-Save</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                    <RefreshCw size={20} />
                                </span>
                                <span className="text-gray-700 text-xs text-center font-medium">Webhook Sync</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                            <span className="text-gray-400 text-xs font-medium">LOGIN</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
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
                            <p className={`flex items-center justify-center gap-1.5 text-xs p-2.5 rounded-lg ${serverStatus === 'checking'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                }`}>
                                {serverStatus === 'checking'
                                    ? <><Clock size={14} /> Please wait while the server wakes up (may take 30-60 seconds)...</>
                                    : <><AlertTriangle size={14} /> Please check server status before logging in</>}
                            </p>
                        )}

                        <button
                            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-xl font-semibold text-base transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg disabled:shadow-gray-200"
                            onClick={login}
                            disabled={serverStatus !== 'awake'}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1 5v5H6v2h5v5h2v-5h5v-2h-5V7h-2z" />
                            </svg>
                            {serverStatus === 'awake' ? 'Login with Airtable' : 'Check Server First ↑'}
                        </button>
                    </div>

                    <div className="mt-5 text-center">
                        <p className="text-gray-500 text-xs leading-relaxed">By logging in, you authorize this app to access your Airtable data.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
