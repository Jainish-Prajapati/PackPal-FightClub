import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Create a history object reference that will be set by the app
let navigateRef = null;

// Function to set the navigate function from the component
export const setNavigateRef = (navigate) => {
  navigateRef = navigate;
};

// Add token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request config error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
      
      // If we get a 401 Unauthorized error, redirect to login
      if (error.response.status === 401) {
        console.log("Authentication error detected, clearing token");
        localStorage.removeItem('token');
        
        // Only redirect to login if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          console.log("Redirecting to login page due to auth error");
          // Use react-router navigate if available, fallback to window.location
          if (navigateRef) {
            navigateRef('/login');
          } else {
            window.location.href = '/login';
          }
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request error (no response):', error.request);
      
      // Network error handling - could be server down or CORS issue
      if (error.code === 'ECONNABORTED') {
        console.error('Request timeout');
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  logout: () => 
    api.post('/auth/logout'),
  
  getProfile: () => 
    api.get('/auth/me'),
  
  updateProfile: (userData) => 
    api.put('/auth/me', userData),
};

// Event services
export const eventService = {
  getAllEvents: () => 
    api.get('/events'),
  
  getEventById: (id) => 
    api.get(`/events/${id}`),
  
  createEvent: (eventData) => 
    api.post('/events', eventData),
  
  updateEvent: (id, eventData) => 
    api.put(`/events/${id}`, eventData),
  
  deleteEvent: (id) => 
    api.delete(`/events/${id}`),
};

// Item services
export const itemService = {
  getEventItems: (eventId) => 
    api.get(`/items/event/${eventId}`),
  
  getItemById: (id) => 
    api.get(`/items/${id}`),
  
  createItem: (itemData) => 
    api.post('/items', itemData),
  
  updateItem: (id, itemData) => 
    api.put(`/items/${id}`, itemData),
  
  updateItemStatus: (id, status) => 
    api.put(`/items/${id}/status`, { status }),
  
  deleteItem: (id) => 
    api.delete(`/items/${id}`),
}; 