import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FormBuilder from './pages/FormBuilder';
import FormViewer from './pages/FormViewer';
import ResponseList from './pages/ResponseList';
import AnimatedBackground from './components/AnimatedBackground';

// Protected Route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-[2px] relative z-10">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-5"></div>
        <p className="text-gray-600 text-base">Loading...</p>
      </div>
    );
  } 

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/form/:formId" element={<FormViewer />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/new"
        element={
          <ProtectedRoute>
            <FormBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:formId/edit"
        element={
          <ProtectedRoute>
            <FormBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:formId/responses"
        element={
          <ProtectedRoute>
            <ResponseList />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to dashboard or login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-[2px] text-center p-5 relative z-10">
          <h1 className="text-[120px] text-indigo-600 m-0 font-bold">404</h1>
          <p className="text-gray-600 m-0 mb-8 text-xl">Page not found</p>
          <a 
            href="/dashboard" 
            className="px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white no-underline rounded-lg font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Go to Dashboard
          </a>
        </div>
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedBackground />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
