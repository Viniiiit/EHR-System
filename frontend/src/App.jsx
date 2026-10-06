import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authAPI, getUser, setUser, setAuthToken } from './services/api';

// Components
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientLogin from './pages/PatientLogin';
import PatientSignup from './pages/PatientSignup';
import PatientDashboard from './pages/PatientDashboard';
import PatientChat from './pages/PatientChat';
import Dashboard from './pages/Dashboard';
import UploadNote from './pages/UploadNote';
import PatientView from './pages/PatientView';
import Chat from './pages/Chat';

// Context for user state
export const UserContext = React.createContext();

function App() {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = getUser();
      
      if (token && savedUser) {
        try {
          // Verify token is still valid
          const currentUser = await authAPI.getCurrentUser();
          setUserState(currentUser);
          setUser(currentUser);
        } catch (error) {
          // Token is invalid, clear auth
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setUserState(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      setAuthToken(response.access_token);
      setUser(response.user);
      setUserState(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUserState(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading EHR NLP System...</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, login, signup, logout }}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="min-h-screen bg-gray-50">
          {user && <Navbar />}
          <main className={user ? 'pt-16' : ''}>
            <Routes>
              <Route 
                path="/login" 
                element={user ? <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/dashboard'} /> : <Login />} 
              />
              <Route 
                path="/signup" 
                element={user ? <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/dashboard'} /> : <Signup />} 
              />
              <Route 
                path="/patient/login" 
                element={user && user.role === 'patient' ? <Navigate to="/patient/dashboard" /> : <PatientLogin />} 
              />
              <Route 
                path="/patient/signup" 
                element={user && user.role === 'patient' ? <Navigate to="/patient/dashboard" /> : <PatientSignup />} 
              />
              <Route 
                path="/dashboard" 
                element={
                  !user
                    ? <Navigate to="/login" />
                    : user.role === 'patient'
                      ? <Navigate to="/patient/dashboard" />
                      : <Dashboard />
                } 
              />
              <Route 
                path="/patient/dashboard" 
                element={user && user.role === 'patient' ? <PatientDashboard /> : <Navigate to="/patient/login" />} 
              />
              <Route 
                path="/patient/chat" 
                element={user && user.role === 'patient' ? <PatientChat /> : <Navigate to="/patient/login" />} 
              />
              <Route 
                path="/patient" 
                element={<Navigate to="/patient/login" />} 
              />
              <Route 
                path="/upload" 
                element={user ? <UploadNote /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/patient/:noteId" 
                element={user ? <PatientView /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/chat" 
                element={user ? <Chat /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/" 
                element={<Navigate to={user ? (user.role === 'patient' ? '/patient/dashboard' : '/dashboard') : '/login'} />} 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
