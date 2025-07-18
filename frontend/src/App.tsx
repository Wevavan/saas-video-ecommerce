import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Import des pages dashboard
import { Overview } from './pages/dashboard/Overview';
import { Videos } from './pages/dashboard/Videos';
import { Generate } from './pages/dashboard/Generate';
import { Credits } from './pages/dashboard/Credits';
import { Settings } from './pages/dashboard/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques (redirectent vers dashboard si connecté) */}
          <Route 
            path="/login" 
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <ProtectedRoute requireAuth={false}>
                <Register />
              </ProtectedRoute>
            } 
          />

          {/* Routes protégées avec layout dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Routes enfants du dashboard */}
            <Route index element={<Overview />} />
            <Route path="videos" element={<Videos />} />
            <Route path="generate" element={<Generate />} />
            <Route path="credits" element={<Credits />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 - redirection vers dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;