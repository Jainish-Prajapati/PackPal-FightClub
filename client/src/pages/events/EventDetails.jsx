import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { eventService, itemService } from '../../services/api.js';
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
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  
  // For Add Item modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    category: 'essentials',
    status: 'not_started',
    assignedToId: ''
  });
  
  // For Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  
  // For editing items
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // For item deletion confirmation
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // For edit event modal
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editedEvent, setEditedEvent] = useState(null);
  
  // Fetch event details
  const fetchEventDetails = useCallback(async () => {
    try {
      // Try to get real data from API
      console.log(`Fetching event details for event ID: ${eventId}`);
      const response = await eventService.getEventById(eventId);
      
      if (response && response.data) {
        console.log('Event details response:', response.data);
        
        // Extract event data from response
        let eventData = null;
        if (response.data.event) {
          eventData = response.data.event;
        } else if (response.data.data && response.data.data.event) {
          eventData = response.data.data.event;
        } else if (response.data.success && response.data.data) {
          eventData = response.data.data;
        } else {
          // Assume the response data itself is the event
          eventData = response.data;
        }
        
        if (eventData && eventData.id) {
          // Ensure source and destination are populated if available
          if (!eventData.source && !eventData.destination && eventData.location) {
            // Try to extract source and destination from location if in "Source to Destination" format
            const locationParts = eventData.location.split(' to ');
            if (locationParts.length === 2) {
              eventData.source = locationParts[0];
              eventData.destination = locationParts[1];
            }
          }
          
          setEvent(eventData);
          
          // Handle items if available
          if (eventData.items && Array.isArray(eventData.items)) {
            console.log('Setting real items:', eventData.items.length, 'items found');
            setItems(eventData.items);
          } else {
            // If we have a valid event but no items, fetch items separately
            console.log('No items in event data, trying to fetch items separately');
            try {
              const itemsResponse = await itemService.getEventItems(eventId);
              if (itemsResponse && itemsResponse.data && itemsResponse.data.items) {
                console.log('Fetched items separately:', itemsResponse.data.items.length, 'items found');
                setItems(itemsResponse.data.items);
              } else {
                console.log('No items found for event, initializing with empty array');
                setItems([]);
              }
            } catch (itemsErr) {
              console.error('Error fetching items separately:', itemsErr);
              setItems([]);
            }
          }
          
          setIsUsingMockData(false);
        } else {
          // If data doesn't contain a proper event, fall back to mock data
          throw new Error("Invalid event data structure");
        }
      } else {
        throw new Error("No data received from server");
      }
    } catch (err) {
      console.error('Error fetching event details, using mock data:', err);
      
      // Create fallback mock data when API fails
      const mockEvent = {
        id: eventId,
        name: "Event #" + eventId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Mock Location",
        source: "Mock Source City",
        destination: "Mock Destination City",
        description: "This is a mock event created because we couldn't load the real data.",
        ownerId: currentUser?.id || "unknown"
      };
      
      // Create some mock items
      const mockItems = [
        {
          id: 'mock-item-1',
          name: 'Sample Tent',
          quantity: 1,
          categoryId: 'essentials',
          status: 'not_started',
          assignedToId: currentUser?.id || 'unknown',
          eventId: eventId
        },
        {
          id: 'mock-item-2',
          name: 'Sleeping Bag',
          quantity: 2,
          categoryId: 'essentials',
          status: 'packed',
          assignedToId: currentUser?.id || 'unknown',
          eventId: eventId
        }
      ];
      
      setEvent(mockEvent);
      setItems(mockItems);
      setIsUsingMockData(true);
    } finally {
      // Set up default UI data
      
      // Default categories
      const defaultCategories = [
        { id: 'essentials', name: 'Essentials' },
        { id: 'clothing', name: 'Clothing' },
        { id: 'electronics', name: 'Electronics' },
        { id: 'other', name: 'Other' }
      ];
      setCategories(defaultCategories);
      
      // Default active category
      setActiveCategory(defaultCategories[0].id);
      
      // Default members
      const defaultMembers = [{
        userId: currentUser?.id || 'unknown',
        role: 'owner',
        user: {
          id: currentUser?.id || 'unknown',
          firstName: currentUser?.firstName || 'User',
          lastName: currentUser?.lastName || '',
          email: currentUser?.email || 'user@example.com'
        }
      }];
      setMembers(defaultMembers);
      
      setIsLoading(false);
    }
  }, [eventId, currentUser]);
  
  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);
  
  // Handle item creation
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    try {
      const itemData = {
        name: newItem.name,
        quantity: parseInt(newItem.quantity),
        categoryId: newItem.category,
        status: newItem.status,
        assignedToId: newItem.assignedToId || currentUser?.id,
        eventId: eventId
      };
      
      // In mock mode, just add locally
      if (isUsingMockData) {
        const mockNewItem = {
          ...itemData,
          id: 'mock-item-' + (items.length + 1)
        };
        setItems([...items, mockNewItem]);
        setShowAddItemModal(false);
        setNewItem({
          name: '',
          quantity: 1,
          category: 'essentials',
          status: 'not_started',
          assignedToId: ''
        });
        return;
      }
      
      // With real API
      const response = await itemService.createItem(itemData);
      
      if (response.data && response.data.success) {
        // Refresh the event details to show the new item
        fetchEventDetails();
      } else {
        throw new Error(response.data?.message || 'Failed to add item');
      }
      
      // Reset and close modal
      setShowAddItemModal(false);
      setNewItem({
        name: '',
        quantity: 1,
        category: 'essentials',
        status: 'not_started',
        assignedToId: ''
      });
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Failed to add item. Please try again.');
    }
  };
  
  // Handle member invitation
  const handleInviteMember = async (e) => {
    e.preventDefault();
    
    try {
      // In mock mode, just add locally
      if (isUsingMockData) {
        const mockNewMember = {
          userId: 'mock-user-' + (members.length + 1),
          role: inviteRole,
          user: {
            id: 'mock-user-' + (members.length + 1),
            firstName: 'Invited',
            lastName: 'User',
            email: inviteEmail
          }
        };
        setMembers([...members, mockNewMember]);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('member');
        return;
      }
      
      // With real API
      const inviteData = {
        email: inviteEmail,
        role: inviteRole,
        eventId: eventId
      };
      
      const response = await eventService.inviteToEvent(eventId, [inviteData]);
      
      if (response.data && response.data.success) {
        // Show success message with the invite information
        const result = response.data.results && response.data.results[0];
        if (result && result.status === 'invited' && result.tempPassword) {
          alert(`Invitation sent to ${inviteEmail} successfully! A temporary password has been generated: ${result.tempPassword}`);
        } else if (result && result.status === 'already_invited') {
          alert(`${inviteEmail} has already been invited to this event.`);
        } else {
          alert(`Invitation sent to ${inviteEmail} successfully!`);
        }
        
        // Refresh the event details to show the new member
        fetchEventDetails();
      } else {
        throw new Error(response.data?.message || 'Failed to invite member');
      }
      
      // Reset and close modal
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err) {
      console.error('Error inviting member:', err);
      alert('Failed to invite member. Please try again.');
    }
  };
  
  // Handle item editing
  const handleEditItem = (item) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      category: item.categoryId,
      status: item.status,
      assignedToId: item.assignedToId || ''
    });
    setShowEditItemModal(true);
  };

  // Handle item deletion
  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setShowDeleteItemModal(true);
  };

  // Save edited item
  const saveEditedItem = async (e) => {
    e.preventDefault();
    
    try {
      const itemData = {
        name: editingItem.name,
        quantity: parseInt(editingItem.quantity),
        categoryId: editingItem.category,
        status: editingItem.status,
        assignedToId: editingItem.assignedToId || currentUser?.id,
        eventId: eventId
      };
      
      // In mock mode, update locally
      if (isUsingMockData) {
        const updatedItems = items.map(item => 
          item.id === editingItem.id ? {...item, ...itemData} : item
        );
        setItems(updatedItems);
        setShowEditItemModal(false);
        setEditingItem(null);
        return;
      }
      
      // With real API
      const response = await itemService.updateItem(editingItem.id, itemData);
      
      if (response.data && response.data.success) {
        // Refresh the event details to show updated item
        fetchEventDetails();
      } else {
        throw new Error(response.data?.message || 'Failed to update item');
      }
      
      // Reset and close modal
      setShowEditItemModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Failed to update item. Please try again.');
    }
  };

  // Confirm item deletion
  const confirmDeleteItem = async () => {
    try {
      // In mock mode, delete locally
      if (isUsingMockData) {
        const filteredItems = items.filter(item => item.id !== itemToDelete.id);
        setItems(filteredItems);
        setShowDeleteItemModal(false);
        setItemToDelete(null);
        return;
      }
      
      // With real API
      const response = await itemService.deleteItem(itemToDelete.id);
      
      if (response.data && response.data.success) {
        // Refresh the event details to reflect the deletion
        fetchEventDetails();
      } else {
        throw new Error(response.data?.message || 'Failed to delete item');
      }
      
      // Reset and close modal
      setShowDeleteItemModal(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };
  
  // Edit event button handler
  const handleEditEvent = () => {
    setEditedEvent({
      name: event.name || '',
      description: event.description || '',
      startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
      location: event.location || '',
      source: event.source || '',
      destination: event.destination || ''
    });
    setShowEditEventModal(true);
  };

  // Save edited event
  const saveEditedEvent = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In mock mode, just update locally
      if (isUsingMockData) {
        setEvent({
          ...event,
          name: editedEvent.name,
          description: editedEvent.description,
          startDate: editedEvent.startDate,
          endDate: editedEvent.endDate,
          location: editedEvent.location,
          source: editedEvent.source,
          destination: editedEvent.destination
        });
        setShowEditEventModal(false);
        return;
      }
      
      // With real API
      const response = await eventService.updateEvent(eventId, {
        name: editedEvent.name,
        description: editedEvent.description,
        startDate: editedEvent.startDate,
        endDate: editedEvent.endDate,
        location: editedEvent.location,
        source: editedEvent.source,
        destination: editedEvent.destination
      });
      
      if (response.data && response.data.success) {
        // Refresh event details
        fetchEventDetails();
      } else {
        throw new Error(response.data?.message || 'Failed to update event');
      }
      
      setShowEditEventModal(false);
    } catch (err) {
      console.error('Error updating event:', err);
      alert('Failed to update event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Safely format dates
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Calculate progress
  const calculateProgress = () => {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    
    try {
      const packedItems = items.filter(item => 
        item && item.status && ['packed', 'delivered'].includes(item.status)).length;
      return Math.round((packedItems / items.length) * 100);
    } catch (err) {
      return 0;
    }
  };
  
  // Check if user can edit
  const isEditable = () => {
    if (!event || !currentUser) return false;
    return event.ownerId === currentUser.id || 
           members.some(m => m.userId === currentUser.id && ['owner', 'admin'].includes(m.role));
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          <h2 className="text-xl font-medium text-gray-900 mb-2">Event not found</h2>
          <p className="text-gray-500 mb-6">The event you're looking for doesn't exist or you don't have access to it.</p>
          
          <Link 
            to="/"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {isUsingMockData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                We couldn't load the real event data. Showing placeholder information instead.
                <button 
                  onClick={() => window.location.reload()} 
                  className="ml-2 font-medium text-yellow-700 underline"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Event header with name, dates, and location */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{event.name || 'Unnamed Event'}</h1>
            <div className="text-gray-500 mb-2">
              {formatDate(event.startDate)} - {formatDate(event.endDate)}
              {event.location && ` • ${event.location}`}
            </div>
            
            {/* Add source and destination display */}
            {(event.source || event.destination) && (
              <div className="text-gray-600 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="font-medium">Travel Route:</span> {event.source || 'N/A'} → {event.destination || 'N/A'}
              </div>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Invite Members
            </button>
            {isEditable() && (
              <button 
                onClick={handleEditEvent} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Edit Event
              </button>
            )}
          </div>
        </div>
        
        {event.description && (
          <div className="bg-gray-50 p-3 rounded-md mt-2">
            <p className="text-gray-700">{event.description}</p>
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
                  onClick={() => setShowAddItemModal(true)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  Add Item
                </button>
              )}
            </div>
            
            {items.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-500 mb-4">No items added yet.</p>
                {isEditable() && (
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Add Your First Item
                  </button>
                )}
              </div>
            ) : (
              <>
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
                  currentUserId={currentUser?.id}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                />
              </>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Team Members</h2>
              {isEditable() && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  Invite
                </button>
              )}
            </div>
            
            <MemberList 
              members={members} 
              currentUserId={currentUser?.id}
              isOwner={true}
            />
          </div>
        </div>
      </div>
      
      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Item</h3>
              
              <form onSubmit={handleAddItem}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="item-name" className="block text-sm font-medium text-gray-700">Item Name</label>
                    <input
                      type="text"
                      id="item-name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="item-quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      id="item-quantity"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="item-category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="item-category"
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="item-status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="item-status"
                      value={newItem.status}
                      onChange={(e) => setNewItem({...newItem, status: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="packed">Packed</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="item-assigned" className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <select
                      id="item-assigned"
                      value={newItem.assignedToId}
                      onChange={(e) => setNewItem({...newItem, assignedToId: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Self</option>
                      {members.map(member => (
                        <option key={member.userId} value={member.userId}>
                          {member.user.firstName} {member.user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
              
              <form onSubmit={handleInviteMember}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      id="invite-email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      id="invite-role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      {members.length === 0 && <option value="owner">Owner</option>}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Item Modal */}
      {showEditItemModal && editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Item</h3>
              
              <form onSubmit={saveEditedItem}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-item-name" className="block text-sm font-medium text-gray-700">Item Name</label>
                    <input
                      type="text"
                      id="edit-item-name"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-item-quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      id="edit-item-quantity"
                      min="1"
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem({...editingItem, quantity: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-item-category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="edit-item-category"
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-item-status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="edit-item-status"
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="packed">Packed</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-item-assigned" className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <select
                      id="edit-item-assigned"
                      value={editingItem.assignedToId}
                      onChange={(e) => setEditingItem({...editingItem, assignedToId: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Self</option>
                      {members.map(member => (
                        <option key={member.userId} value={member.userId}>
                          {member.user.firstName} {member.user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditItemModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Item Confirmation Modal */}
      {showDeleteItemModal && itemToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete "{itemToDelete.name}"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteItemModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteItem}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Event Modal */}
      {showEditEventModal && editedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Event</h3>
              
              <form onSubmit={saveEditedEvent}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="event-name" className="block text-sm font-medium text-gray-700">Event Name</label>
                    <input
                      type="text"
                      id="event-name"
                      value={editedEvent.name}
                      onChange={(e) => setEditedEvent({...editedEvent, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="event-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                      <input
                        type="date"
                        id="event-start-date"
                        value={editedEvent.startDate}
                        onChange={(e) => setEditedEvent({...editedEvent, startDate: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="event-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                      <input
                        type="date"
                        id="event-end-date"
                        value={editedEvent.endDate}
                        onChange={(e) => setEditedEvent({...editedEvent, endDate: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="event-location" className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      id="event-location"
                      value={editedEvent.location}
                      onChange={(e) => setEditedEvent({...editedEvent, location: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="event-source" className="block text-sm font-medium text-gray-700">Source City</label>
                      <input
                        type="text"
                        id="event-source"
                        value={editedEvent.source}
                        onChange={(e) => setEditedEvent({...editedEvent, source: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter source city"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="event-destination" className="block text-sm font-medium text-gray-700">Destination City</label>
                      <input
                        type="text"
                        id="event-destination"
                        value={editedEvent.destination}
                        onChange={(e) => setEditedEvent({...editedEvent, destination: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter destination city"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="event-description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="event-description"
                      rows={3}
                      value={editedEvent.description}
                      onChange={(e) => setEditedEvent({...editedEvent, description: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditEventModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails; 