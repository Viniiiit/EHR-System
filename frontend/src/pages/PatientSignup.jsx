import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../App';

const PatientSignup = () => {
  const { signup } = useContext(UserContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...rest } = formData;
      await signup({ ...rest, role: 'patient' });
      navigate('/patient/login');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((d) => d?.msg || JSON.stringify(d)).join(' ') : (detail || 'Signup failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-primary-600 to-medical-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your patient account</h2>
          <p className="mt-2 text-sm text-gray-600">Upload prescriptions and view your insights</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input id="username" name="username" type="text" required className="input-field mt-1" placeholder="Choose a username" value={formData.username} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input id="email" name="email" type="email" required className="input-field mt-1" placeholder="Enter your email" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input id="full_name" name="full_name" type="text" required className="input-field mt-1" placeholder="Enter your full name" value={formData.full_name} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input id="password" name="password" type="password" required className="input-field mt-1" placeholder="Create a password" value={formData.password} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required className="input-field mt-1" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} />
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center py-3">{loading ? <div className="loading-spinner h-5 w-5"></div> : 'Create Patient Account'}</button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Already have an account? <Link to="/patient/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in here</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientSignup;


