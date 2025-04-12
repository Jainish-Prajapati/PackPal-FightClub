import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { eventService } from '../services/api.js';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  console.log("Dashboard rendering, currentUser:", currentUser);

  useEffect(() => {
    console.log("Dashboard mounted");
    
    const fetchEvents = async () => {
      try {
        console.log("Fetching events...");
        const response = await eventService.getAllEvents();
        
        console.log("Events response:", response.data);
        
        if (response.data.success) {
          setEvents(response.data.data);
          console.log("Events loaded successfully:", response.data.data.length, "events");
        } else {
          console.error("Events API returned error:", response.data.message);
          setError(response.data.message || 'Failed to load events');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    
    return () => console.log("Dashboard unmounted");
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
        <h1 className="text-2xl font-bold">My Travel Events</h1>
        {['owner', 'admin'].includes(currentUser?.role) && (
          <Link 
            to="/events/create" 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Create Event
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h2 className="text-xl font-medium text-gray-900 mb-2">No events yet</h2>
          <p className="text-gray-500 mb-6">
            {['owner', 'admin'].includes(currentUser?.role) 
              ? "Create your first event to get started!" 
              : "You haven't been invited to any events yet."}
          </p>
          {['owner', 'admin'].includes(currentUser?.role) && (
            <Link 
              to="/events/create" 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create Your First Event
            </Link>
          )}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.name}</h3>
                <p className="text-gray-500 text-sm mb-3">
                  {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                </p>
                <p className="text-gray-600 mb-4">{event.location}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">
                    {event.EventMembers?.length || 0} participants
                  </span>
                  <div className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                    {event.role || 'Member'}
                  </div>
                </div>
              </div>
              <div className="h-2 bg-indigo-600"></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 