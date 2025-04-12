import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, setNavigateRef } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Set the navigate reference for API redirects
  useEffect(() => {
    setNavigateRef(navigate);
  }, [navigate]);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await authService.getProfile();
        
        if (response.data.success) {
          setCurrentUser(response.data.data);
          setIsAuthenticated(true);
        } else {
          // Clear token if invalid
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      console.log("Starting login request for:", email);
      
      // Try direct fetch to see if server is reachable
      try {
        const testResponse = await fetch('/api/auth/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log("Server health check:", testResponse.status);
      } catch (healthError) {
        console.error("Server health check failed:", healthError);
      }
      
      const response = await authService.login(email, password);
      
      console.log("Login response:", response.data);
      
      if (response.data.success) {
        // Save token to localStorage
        const token = response.data.data.token;
        localStorage.setItem('token', token);
        
        setCurrentUser(response.data.data.user);
        setIsAuthenticated(true);
        
        // Use React navigation instead of window.location
        console.log("Redirecting to dashboard...");
        navigate('/');
        
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      console.error('Login failed:', error);
      
      // Check if there's an actual response with data
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || 'Invalid email or password'
        };
      }
      
      // Handle network errors or other issues
      return {
        success: false,
        message: 'Unable to connect to the server. Please check your internet connection.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      console.log("Sending registration data:", userData);
      
      const response = await authService.register(userData);
      
      console.log("Registration response:", response.data);
      
      if (response.data.success) {
        // Save token to localStorage
        const token = response.data.data.token;
        localStorage.setItem('token', token);
        
        setCurrentUser(response.data.data.user);
        setIsAuthenticated(true);
        
        // Use React navigation instead of window.location
        console.log("Redirecting to dashboard...");
        navigate('/');
        
        return { success: true };
      }
      return { 
        success: false, 
        message: response.data.message || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration failed:', error);
      // Check for specific error about duplicate email
      if (error.response?.status === 400 && 
          error.response.data?.message?.includes('email already exists')) {
        return {
          success: false,
          message: 'An account with this email already exists.'
        };
      }
      
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Registration failed';
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('token');
      setCurrentUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 