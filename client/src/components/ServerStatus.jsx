import { useState } from 'react';
import { Search, CheckCircle, Moon, Loader } from 'lucide-react';

function ServerStatus() {
    const [serverStatus, setServerStatus] = useState('unknown'); // 'unknown' | 'checking' | 'awake' | 'sleeping'
    const [isExpanded, setIsExpanded] = useState(false);

    const checkServerHealth = async () => {
        setServerStatus('checking');
        setIsExpanded(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for cold starts

            const response = await fetch('https://airtabledynamicform.onrender.com/health', {
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

    const getStatusIcon = () => {
        switch (serverStatus) {
            case 'checking': return <Loader className="animate-spin" size={16} />;
            case 'awake': return <CheckCircle size={16} />;
            case 'sleeping': return <Moon size={16} />;
            default: return <Search size={16} />;
        }
    };

    const getStatusText = () => {
        switch (serverStatus) {
            case 'checking': return 'Checking...';
            case 'awake': return 'Server Awake';
            case 'sleeping': return 'Server Sleeping';
            default: return 'Check Server';
        }
    };

    const getWidgetClasses = () => {
        const base = "fixed bottom-4 right-4 z-50";
        if (serverStatus === 'awake') {
            return `${base}`;
        } else if (serverStatus === 'sleeping') {
            return `${base}`;
        }
        return base;
    };

    const getButtonClasses = () => {
        const base = "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl border-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70";
        if (serverStatus === 'awake') {
            return `${base} bg-green-50 text-green-800 border-2 border-green-300 hover:bg-green-100`;
        } else if (serverStatus === 'sleeping') {
            return `${base} bg-yellow-50 text-yellow-800 border-2 border-yellow-300 hover:bg-yellow-100`;
        } else if (serverStatus === 'checking') {
            return `${base} bg-blue-50 text-blue-800 border-2 border-blue-300`;
        }
        return `${base} bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100`;
    };

    return (
        <div className={getWidgetClasses()}>
            <button
                className={getButtonClasses()}
                onClick={checkServerHealth}
                disabled={serverStatus === 'checking'}
                title="Check if server is awake"
            >
                {getStatusIcon()}
                <span>{getStatusText()}</span>
            </button>

            {isExpanded && serverStatus === 'sleeping' && (
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs flex items-center gap-1.5 shadow-md whitespace-nowrap">
                    <Moon size={14} /> Server may take 30-60s to wake up. Click to retry.
                </div>
            )}
        </div>
    );
}

export default ServerStatus;
