import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import ItemList from '../../components/items/ItemList';
import MemberList from '../../components/members/MemberList';
import ItemCategoryTabs from '../../components/items/ItemCategoryTabs';
import EventProgressBar from '../../components/events/EventProgressBar';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`/api/events/${eventId}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setEvent(response.data.data.event);
          setItems(response.data.data.items || []);
          setCategories(response.data.data.categories || []);
          setMembers(response.data.data.members || []);
          
          if (response.data.data.categories?.length > 0) {
            setActiveCategory(response.data.data.categories[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);
  
  const calculateProgress = () => {
    if (!items || items.length === 0) return 0;
    
    const packedItems = items.filter(item => ['packed', 'delivered'].includes(item.status)).length;
    return Math.round((packedItems / items.length) * 100);
  };
  
  const isEditable = () => {
    if (!event || !currentUser) return false;
    
    const userRole = members.find(m => m.userId === currentUser.id)?.role || 'viewer';
    return ['owner', 'admin'].includes(userRole);
  };
  
  if (isLoading) {
    return <div className="loading-spinner" />;
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 mb-2">Event not found</h2>
        <p className="text-gray-500 mb-6">The event you're looking for doesn't exist or you don't have access to it.</p>
        <Link 
          to="/"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-gray-500">
            {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
            {event.location && ` • ${event.location}`}
          </p>
        </div>
        
        {isEditable() && (
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => navigate(`/events/${eventId}/invite`)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Invite Members
            </button>
            <button
              onClick={() => navigate(`/events/${eventId}/edit`)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Edit Event
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Overall Progress</h2>
        <EventProgressBar progress={calculateProgress()} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Packing Items</h2>
              {isEditable() && (
                <button
                  onClick={() => navigate(`/events/${eventId}/items/add`)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  Add Item
                </button>
              )}
            </div>
            
            <ItemCategoryTabs 
              categories={categories} 
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
            
            <ItemList 
              items={items.filter(item => 
                activeCategory ? item.categoryId === activeCategory : true
              )} 
              members={members}
              isEditable={isEditable()}
              currentUserId={currentUser.id}
            />
          </div>
        </div>
        
        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Team Members</h2>
            </div>
            
            <MemberList 
              members={members} 
              currentUserId={currentUser.id}
              isOwner={members.find(m => m.userId === currentUser.id)?.role === 'owner'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails; 