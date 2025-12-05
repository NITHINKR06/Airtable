import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for token in URL (after OAuth redirect) or localStorage
    useEffect(() => {
        const init = async () => {
            try {
                // Check URL for token (from OAuth redirect)
                const urlParams = new URLSearchParams(window.location.search);
                const tokenFromUrl = urlParams.get('token');

                if (tokenFromUrl) {
                    localStorage.setItem('token', tokenFromUrl);
                    // Clean up URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }

                const token = localStorage.getItem('token');
                if (token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await api.get('/auth/me');
                    setUser(response.data.user);
                }
            } catch (err) {
                console.error('Auth init error:', err);
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    const login = () => {
        // Redirect to backend OAuth endpoint
        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
