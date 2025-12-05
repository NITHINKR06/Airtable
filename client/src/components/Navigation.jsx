import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Plus, LogOut, ArrowLeft } from 'lucide-react';

function Navigation() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const isFormBuilder = location.pathname.includes('/forms/new') || location.pathname.includes('/forms/') && location.pathname.includes('/edit');

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-5 md:px-10 py-4">
                <div className="flex items-center justify-between">
                    {/* Left side - Logo/Brand */}
                    <div className="flex items-center gap-6">
                        <Link 
                            to="/dashboard" 
                            className="text-xl md:text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                            Form Builder
                        </Link>
                        
                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-1">
                            <Link
                                to="/dashboard"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    location.pathname === '/dashboard'
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Home size={16} className="inline mr-1.5" />
                                Dashboard
                            </Link>
                            <Link
                                to="/forms/new"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    location.pathname === '/forms/new'
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Plus size={16} className="inline mr-1.5" />
                                New Form
                            </Link>
                        </div>
                    </div>

                    {/* Right side - User info and actions */}
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline text-gray-600 text-sm">
                            {user?.email || user?.name || 'User'}
                        </span>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;

