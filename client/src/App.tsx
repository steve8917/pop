import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import Dashboard from './pages/Dashboard';
import Availability from './pages/Availability';
import Schedule from './pages/Schedule';
import ScheduleChat from './pages/ScheduleChat';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Experiences from './pages/Experiences';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/resend-verification" element={<ResendVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/schedule/:scheduleId/chat" element={<ScheduleChat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/experiences" element={<Experiences />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ChatProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#363636',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  borderRadius: '0.75rem',
                  padding: '1rem'
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff'
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff'
                  }
                }
              }}
            />
          </ChatProvider>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
