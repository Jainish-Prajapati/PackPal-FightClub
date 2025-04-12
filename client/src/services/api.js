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
      console.log('API Request with token:', config.method.toUpperCase(), config.url);
    } else {
      console.log('API Request without token:', config.method.toUpperCase(), config.url);
    }
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
    console.log('API Response:', response.status, response.config.url, 'Data:', response.data ? 'Received' : 'Empty');
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
            console.log("Navigate reference not set, falling back to window.location");
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
  
  getEventById: (id) => {
    // Add retry logic for this specific endpoint
    const maxRetries = 2;
    let currentRetry = 0;
    
    const attempt = async () => {
      try {
        console.log(`Attempting to fetch event ${id} (Attempt ${currentRetry + 1}/${maxRetries + 1})`);
        return await api.get(`/events/${id}`);
      } catch (error) {
        console.error(`Error fetching event ${id}:`, error);
        currentRetry++;
        
        if (currentRetry <= maxRetries) {
          console.log(`Retrying... (${currentRetry}/${maxRetries})`);
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attempt();
        }
        throw error;
      }
    };
    
    return attempt();
  },
  
  createEvent: (eventData) => 
    api.post('/events', eventData),
  
  updateEvent: (id, eventData) => 
    api.put(`/events/${id}`, eventData),
  
  deleteEvent: (id) => 
    api.delete(`/events/${id}`),
    
  inviteToEvent: (id, invites) => 
    api.post(`/events/${id}/invite`, { invites }),
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

// Location services
export const locationService = {
  // Get a list of Indian cities - main implementation using local data
  getIndianCities: (query = '') => {
    if (!query || query.length < 2) return Promise.resolve([]);
    
    // Comprehensive list of major Indian cities
    const indianCities = [
      "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", 
      "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", 
      "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", 
      "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", 
      "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Haora", "Coimbatore", "Jabalpur",
      "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Chandigarh", 
      "Guwahati", "Solapur", "Hubli", "Dharwad", "Mysore", "Tiruchirappalli", "Bareilly", 
      "Aligarh", "Moradabad", "Jalandhar", "Bhubaneswar", "Salem", "Warangal", "Mira-Bhayandar", 
      "Jalgaon", "Guntur", "Thiruvananthapuram", "Bhiwandi", "Saharanpur", "Gorakhpur", 
      "Bikaner", "Amravati", "Noida", "Jamshedpur", "Bhilai", "Cuttack", "Firozabad", 
      "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Nanded", 
      "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri", 
      "Jhansi", "Ulhasnagar", "Jammu", "Sangli-Miraj", "Kupwad", "Mangalore", "Erode", 
      "Belgaum", "Ambattur", "Tirunelveli", "Malegaon", "Gaya", "Udaipur", 
      "Maheshtala", "Tirupur", "Davanagere",
      // Additional tier 2 and tier 3 cities
      "Shimla", "Gangtok", "Darjeeling", "Ooty", "Rishikesh", "Haridwar", "Pushkar",
      "Puri", "Hampi", "Panaji", "Shillong", "Imphal", "Aizawl", "Itanagar", "Kohima",
      "Port Blair", "Silvassa", "Daman", "Diu", "Kavaratti", "Puducherry", "Agartala"
    ];
    
    // Filter cities based on the query (case-insensitive)
    const filteredCities = indianCities.filter(city => 
      city.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Limit to 10 results for performance
    
    // Try to fetch from an alternative API for more options, but don't wait for it
    if (filteredCities.length < 5) {
      this.fetchFromAlternativeApi(query).then(apiCities => {
        // This will be used for future searches if the API responds
        if (apiCities.length > 0) {
          // Cache the results in localStorage for future use
          try {
            const existingCache = JSON.parse(localStorage.getItem('citiesCache') || '{}');
            existingCache[query.toLowerCase()] = apiCities;
            localStorage.setItem('citiesCache', JSON.stringify(existingCache));
          } catch (e) {
            console.error('Error caching cities:', e);
          }
        }
      });
    }
    
    // Check if we have cached results for this query
    try {
      const cachedResults = JSON.parse(localStorage.getItem('citiesCache') || '{}')[query.toLowerCase()];
      if (cachedResults && cachedResults.length > 0) {
        // Combine with filtered cities, remove duplicates, and limit to 10
        const combinedResults = [...new Set([...cachedResults, ...filteredCities])].slice(0, 10);
        return Promise.resolve(combinedResults);
      }
    } catch (e) {
      console.error('Error reading cached cities:', e);
    }
    
    return Promise.resolve(filteredCities);
  },
  
  // Try to fetch from a third-party API that provides Indian cities
  fetchFromAlternativeApi: (query = '') => {
    if (!query || query.length < 2) return Promise.resolve([]);
    
    // This could be replaced with any CORS-friendly API for Indian cities
    // Using a mock implementation that returns a promise with a delay
    return new Promise(resolve => {
      setTimeout(() => {
        // Additional cities not in our main list
        const additionalCities = [
          "Alappuzha", "Alibaug", "Almora", "Badrinath", "Barog", "Bhandardara", 
          "Bharatpur", "Bhimtal", "Bhopal", "Bhubaneswar", "Bodh Gaya", "Chail", 
          "Chamba", "Cherrapunji", "Chikmagalur", "Chitkul", "Coorg", "Coonoor", 
          "Dalhousie", "Dehradun", "Dharamshala", "Dibrugarh", "Digha", "Dispur", 
          "Dwaraka", "Faridabad", "Fatehpur Sikri", "Ganjam", "Ganpatipule", "Goa", 
          "Gokarna", "Gulmarg", "Gwalior", "Halebid", "Hampi", "Hassan", "Hospet", 
          "Igatpuri", "Jaisalmer", "Jorhat", "Kalimpong", "Kanchipuram", "Kanha", 
          "Kannur", "Kanpur", "Kanyakumari", "Kasauli", "Kedarnath", "Khandala", 
          "Khajuraho", "Kochi", "Kodaikanal", "Kolad", "Kotagiri", "Kottayam", 
          "Kovalam", "Kumbakonam", "Lachung", "Leh", "Lonavala", "Lucknow", 
          "Madikeri", "Madurai", "Mahabaleshwar", "Mahabalipuram", "Malvan", 
          "Manali", "Mandarmani", "Matheran", "Mukteshwar", "Mussoorie", "Mysore", 
          "Nainital", "Nashik", "Nellore", "Ooty", "Orchha", "Pahalgam", "Panchgani", 
          "Patnitop", "Pelling", "Puri", "Pushkar", "Raipur", "Rajahmundry", 
          "Rajkot", "Ranikhet", "Sangli", "Saputara", "Shillong", "Shimla", 
          "Shirdi", "Siliguri", "Somnath", "Srinagar", "Tawang", "Tirupati", 
          "Udaipur", "Ujjain", "Varanasi", "Varkala", "Vijayawada", "Visakhapatnam", 
          "Wayanad", "Yercaud", "Ziro"
        ];
        
        const filteredAdditional = additionalCities.filter(city => 
          city.toLowerCase().includes(query.toLowerCase()) &&
          !city.toLowerCase().endsWith('pur') && // Avoid too many similar names
          query.length > 2  // Only add these cities for more specific searches
        ).slice(0, 5);
        
        resolve(filteredAdditional);
      }, 500); // Small delay to simulate API call
    });
  }
}; 