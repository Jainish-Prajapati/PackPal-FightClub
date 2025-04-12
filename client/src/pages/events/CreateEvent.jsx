import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { eventService, locationService } from '../../services/api.js';

const CreateEvent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // For searchable dropdowns
  const [sourceSearch, setSourceSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  
  // State for API-fetched cities
  const [sourceCities, setSourceCities] = useState([]);
  const [destinationCities, setDestinationCities] = useState([]);
  const [isFetchingSourceCities, setIsFetchingSourceCities] = useState(false);
  const [isFetchingDestinationCities, setIsFetchingDestinationCities] = useState(false);
  
  // Get today's date for date input min attribute
  const today = new Date().toISOString().split('T')[0];

  const formik = useFormik({
    initialValues: {
      name: '',
      startDate: '',
      endDate: '',
      source: '',
      destination: '',
      purpose: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      startDate: Yup.date()
        .min(today, 'Start date cannot be in the past')
        .required('Required'),
      endDate: Yup.date()
        .min(Yup.ref('startDate'), 'End date must be after start date')
        .required('Required'),
      source: Yup.string().required('Source city is required'),
      destination: Yup.string().required('Destination city is required'),
      purpose: Yup.string().required('Required'),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);

      try {
        // Format location as "Source to Destination"
        const location = `${values.source} to ${values.destination}`;
        
        console.log("Creating new event:", {...values, location});
        const response = await eventService.createEvent({
          name: values.name,
          description: values.purpose,
          startDate: values.startDate,
          endDate: values.endDate,
          location: location,
          source: values.source,
          destination: values.destination
        });
        
        console.log("Event creation response:", response.data);
        
        // Check if we received a valid response with event data
        if (response && response.data) {
          if (response.data.success && response.data.event && response.data.event.id) {
            console.log("Event created successfully, navigating to event page");
            navigate(`/events/${response.data.event.id}`);
            return;
          } else if (response.data.id) {
            // Some APIs might return the event directly
            console.log("Event created successfully (direct response), navigating to event page");
            navigate(`/events/${response.data.id}`);
            return;
          }
        }
        
        // If we get here, something went wrong but the request didn't fail
        setError('Failed to create event. The response format was unexpected.');
      } catch (err) {
        console.error('Error creating event:', err);
        setError(err.response?.data?.message || 'Failed to create event. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Handle clicking outside the dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSourceDropdown && !event.target.closest('.source-dropdown-container')) {
        setShowSourceDropdown(false);
      }
      if (showDestinationDropdown && !event.target.closest('.destination-dropdown-container')) {
        setShowDestinationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSourceDropdown, showDestinationDropdown]);

  // Fetch source cities when sourceSearch changes
  useEffect(() => {
    const fetchSourceCities = async () => {
      if (sourceSearch.length < 2) {
        setSourceCities([]);
        return;
      }
      
      setIsFetchingSourceCities(true);
      try {
        const cities = await locationService.getIndianCities(sourceSearch);
        setSourceCities(cities);
      } catch (error) {
        console.error('Error fetching source cities:', error);
        // Use a basic fallback if all else fails
        setSourceCities(['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'].filter(
          city => city.toLowerCase().includes(sourceSearch.toLowerCase())
        ));
      } finally {
        setIsFetchingSourceCities(false);
      }
    };
    
    const timer = setTimeout(fetchSourceCities, 300);
    return () => clearTimeout(timer);
  }, [sourceSearch]);
  
  // Fetch destination cities when destinationSearch changes
  useEffect(() => {
    const fetchDestinationCities = async () => {
      if (destinationSearch.length < 2) {
        setDestinationCities([]);
        return;
      }
      
      setIsFetchingDestinationCities(true);
      try {
        const cities = await locationService.getIndianCities(destinationSearch);
        setDestinationCities(cities);
      } catch (error) {
        console.error('Error fetching destination cities:', error);
        // Use a basic fallback if all else fails
        setDestinationCities(['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'].filter(
          city => city.toLowerCase().includes(destinationSearch.toLowerCase())
        ));
      } finally {
        setIsFetchingDestinationCities(false);
      }
    };
    
    const timer = setTimeout(fetchDestinationCities, 300);
    return () => clearTimeout(timer);
  }, [destinationSearch]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create a New Travel Event</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Event Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.name}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {formik.touched.name && formik.errors.name ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.name}</div>
            ) : null}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                min={today}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.startDate}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {formik.touched.startDate && formik.errors.startDate ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.startDate}</div>
              ) : null}
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                min={formik.values.startDate || today}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.endDate}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {formik.touched.endDate && formik.errors.endDate ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.endDate}</div>
              ) : null}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative source-dropdown-container">
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                Source City
              </label>
              <input
                id="source"
                name="source"
                type="text"
                autoComplete="off"
                placeholder="Search and select a city"
                value={sourceSearch}
                onChange={(e) => {
                  setSourceSearch(e.target.value);
                  setShowSourceDropdown(true);
                }}
                onFocus={() => setShowSourceDropdown(true)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {showSourceDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
                  {isFetchingSourceCities ? (
                    <div className="px-4 py-2 text-gray-500">Loading cities...</div>
                  ) : sourceCities.length > 0 ? (
                    sourceCities.map((city) => (
                      <div
                        key={city}
                        className="cursor-pointer px-4 py-2 hover:bg-indigo-50"
                        onClick={() => {
                          setSourceSearch(city);
                          formik.setFieldValue('source', city);
                          setShowSourceDropdown(false);
                        }}
                      >
                        {city}
                      </div>
                    ))
                  ) : sourceSearch.length > 0 ? (
                    <div className="px-4 py-2 text-gray-500">No cities found</div>
                  ) : (
                    <div className="px-4 py-2 text-gray-500">Type at least 2 characters to search</div>
                  )}
                </div>
              )}
              <input
                type="hidden"
                name="source"
                value={formik.values.source}
              />
              {formik.touched.source && formik.errors.source ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.source}</div>
              ) : null}
            </div>
            
            <div className="relative destination-dropdown-container">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                Destination City
              </label>
              <input
                id="destination"
                name="destination"
                type="text"
                autoComplete="off"
                placeholder="Search and select a city"
                value={destinationSearch}
                onChange={(e) => {
                  setDestinationSearch(e.target.value);
                  setShowDestinationDropdown(true);
                }}
                onFocus={() => setShowDestinationDropdown(true)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {showDestinationDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
                  {isFetchingDestinationCities ? (
                    <div className="px-4 py-2 text-gray-500">Loading cities...</div>
                  ) : destinationCities.length > 0 ? (
                    destinationCities.map((city) => (
                      <div
                        key={city}
                        className="cursor-pointer px-4 py-2 hover:bg-indigo-50"
                        onClick={() => {
                          setDestinationSearch(city);
                          formik.setFieldValue('destination', city);
                          setShowDestinationDropdown(false);
                        }}
                      >
                        {city}
                      </div>
                    ))
                  ) : destinationSearch.length > 0 ? (
                    <div className="px-4 py-2 text-gray-500">No cities found</div>
                  ) : (
                    <div className="px-4 py-2 text-gray-500">Type at least 2 characters to search</div>
                  )}
                </div>
              )}
              <input
                type="hidden"
                name="destination"
                value={formik.values.destination}
              />
              {formik.touched.destination && formik.errors.destination ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.destination}</div>
              ) : null}
            </div>
          </div>
          
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
              Purpose
            </label>
            <textarea
              id="purpose"
              name="purpose"
              rows={4}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.purpose}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {formik.touched.purpose && formik.errors.purpose ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.purpose}</div>
            ) : null}
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent; 