import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { eventService } from '../../services/api.js';
import { BiCheckCircle } from 'react-icons/bi';

const CompletedEvents = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchCompletedEvents = async () => {
      try {
        setIsLoading(true);
        const response = await eventService.getCompletedEvents();
        
        if (response.data.success) {
          setEvents(response.data.events);
        } else {
          setError(response.data.message || 'Failed to load completed events');
        }
      } catch (err) {
        console.error('Error fetching completed events:', err);
        setError('Failed to load completed events. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedEvents();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Completed Events</h1>
        <Link 
          to="/"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BiCheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No completed events</h2>
          <p className="text-gray-500 mb-6">
            You don't have any completed events yet. When you end an event, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link 
              key={event.id} 
              to={`/events/${event.id}`}
              className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded-full">
                    Completed
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-3">
                  {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                </p>
                <p className="text-gray-600 mb-4">{event.location}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">
                    {event.EventMembers?.length || 0} participants
                  </span>
                  <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    {event.role || 'Member'}
                  </div>
                </div>
              </div>
              <div className="h-2 bg-gray-400"></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedEvents; 