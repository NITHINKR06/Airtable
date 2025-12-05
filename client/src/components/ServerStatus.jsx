import { useState } from 'react';
import { Search, CheckCircle, Moon, Loader } from 'lucide-react';
import './ServerStatus.css';

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
            case 'checking': return <Loader className="status-icon spinning" size={16} />;
            case 'awake': return <CheckCircle className="status-icon" size={16} />;
            case 'sleeping': return <Moon className="status-icon" size={16} />;
            default: return <Search className="status-icon" size={16} />;
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

    return (
        <div className={`server-status-widget ${serverStatus}`}>
            <button
                className="server-status-toggle"
                onClick={checkServerHealth}
                disabled={serverStatus === 'checking'}
                title="Check if server is awake"
            >
                {getStatusIcon()}
                <span className="status-text">{getStatusText()}</span>
            </button>

            {isExpanded && serverStatus === 'sleeping' && (
                <div className="status-tooltip">
                    <Moon size={14} /> Server may take 30-60s to wake up. Click to retry.
                </div>
            )}
        </div>
    );
}

export default ServerStatus;
