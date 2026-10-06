import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserContext } from '../App';

const Navbar = () => {
  const { user, logout } = useContext(UserContext);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user?.role === 'patient' ? "/patient/dashboard" : "/dashboard"} className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-medical-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gradient">EHR NLP System</h1>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            <div className="hidden md:flex space-x-8">
              <Link
                to={user?.role === 'patient' ? "/patient/dashboard" : "/dashboard"}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(user?.role === 'patient' ? '/patient/dashboard' : '/dashboard')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {user?.role === 'patient' ? 'My Prescriptions' : 'Dashboard'}
              </Link>
              {user?.role !== 'patient' && (
              <Link
                to="/upload"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/upload')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Upload Note
              </Link>
              )}
              {user?.role !== 'patient' && (
              <Link
                to="/chat"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/chat')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Chat
              </Link>
              )}
              {user?.role === 'patient' && (
              <Link
                to="/patient/chat"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/patient/chat')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Chat
              </Link>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{user?.full_name}</span>
                  <span className="text-gray-500 ml-2">({user?.role})</span>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
