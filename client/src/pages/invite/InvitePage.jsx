import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [userExists, setUserExists] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  
  // Check invitation validity on component mount
  useEffect(() => {
    const checkInvitation = async () => {
      try {
        // Make a request to verify the invitation token
        const response = await axios.get(`/api/invites/${token}`);
        
        if (response.data && response.data.success) {
          setInviteData(response.data.invite);
          setUserExists(!!response.data.invite.userExists);
          
          if (response.data.invite.userExists) {
            // If user exists, pre-fill the name fields
            setFormData({
              ...formData,
              firstName: response.data.invite.firstName || '',
              lastName: response.data.invite.lastName || ''
            });
          }
        } else {
          setError('Invalid or expired invitation. Please contact the event organizer for a new invitation.');
        }
      } catch (err) {
        console.error('Error checking invitation:', err);
        setError('Failed to verify the invitation. It may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      checkInvitation();
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
  }, [token]);
  
  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!userExists && (!formData.firstName || !formData.lastName)) {
      setError('Please provide your first and last name');
      return;
    }
    
    if (!formData.password) {
      setError('Please provide a password');
      return;
    }
    
    if (!userExists && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      // Accept the invitation
      const response = await axios.post(`/api/auth/accept-invite/${token}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password
      });
      
      if (response.data && response.data.success) {
        // Automatically log the user in
        await login(response.data.token);
        
        // Redirect to the event page if there's an event ID
        if (response.data.event && response.data.event.id) {
          navigate(`/events/${response.data.event.id}`);
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(response.data?.message || 'Failed to accept invitation');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.response?.data?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="bg-white shadow sm:rounded-lg p-6 max-w-lg w-full">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Invitation Error</h2>
            <p className="text-gray-500 mb-6 text-center">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="bg-white shadow sm:rounded-lg p-6 max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600">PackPal</h1>
          <h2 className="text-2xl font-bold mt-2">Accept Invitation</h2>
          {inviteData && (
            <div className="mt-4 text-left p-4 bg-indigo-50 rounded-md">
              <p className="text-gray-700">
                <span className="font-medium">You've been invited to join:</span><br />
                <span className="text-lg font-semibold">{inviteData.eventName}</span>
              </p>
              {inviteData.inviterName && (
                <p className="text-gray-700 mt-2">
                  <span className="font-medium">Invited by:</span> {inviteData.inviterName}
                </p>
              )}
              <p className="text-gray-700 mt-2">
                <span className="font-medium">Your role:</span> {inviteData.role || 'Member'}
              </p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!userExists && (
            <>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </>
          )}
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {userExists ? 'Enter your password to accept' : 'Choose a password'}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          {!userExists && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          )}
          
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Accept Invitation'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvitePage; 