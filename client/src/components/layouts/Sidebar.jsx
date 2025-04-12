import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BiX, BiHome, BiCalendarEvent, BiUser, BiLogOut, BiCheck } from 'react-icons/bi';
import { eventService } from '../../services/api';

// Create a context to manage sidebar updates
export const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const refreshSidebar = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <SidebarContext.Provider value={{ refreshSidebar, refreshTrigger }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const [hasCompletedEvents, setHasCompletedEvents] = useState(false);
  const { refreshTrigger } = useContext(SidebarContext) || { refreshTrigger: 0 };
  const location = useLocation();
  
  // Check if user has any completed events
  useEffect(() => {
    const checkCompletedEvents = async () => {
      try {
        const response = await eventService.getCompletedEvents();
        if (response.data && response.data.success && response.data.events) {
          setHasCompletedEvents(response.data.events.length > 0);
        }
      } catch (error) {
        console.error("Error checking completed events:", error);
      }
    };
    
    if (currentUser) {
      checkCompletedEvents();
    }
  }, [currentUser, refreshTrigger, location.pathname]); // Re-check when location or refreshTrigger changes

  // Navigation items for the sidebar
  const Navigation = () => {
    return (
      <>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              isActive
                ? 'bg-indigo-800 text-white'
                : 'text-indigo-100 hover:bg-indigo-600'
            }`
          }
        >
          <BiHome className="mr-3 h-6 w-6" />
          Dashboard
        </NavLink>
        
        {hasCompletedEvents && (
          <NavLink
            to="/completed-events"
            className={({ isActive }) =>
              `flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-indigo-800 text-white'
                  : 'text-indigo-100 hover:bg-indigo-600'
              }`
            }
          >
            <BiCheck className="mr-3 h-6 w-6" />
            Completed Events
          </NavLink>
        )}
        
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              isActive
                ? 'bg-indigo-800 text-white'
                : 'text-indigo-100 hover:bg-indigo-600'
            }`
          }
        >
          <BiUser className="mr-3 h-6 w-6" />
          Profile
        </NavLink>
      </>
    );
  };

  // User profile dropdown in sidebar
  const UserDropdown = () => {
    return (
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-indigo-800 flex items-center justify-center text-white">
            {currentUser?.firstName?.charAt(0)}
            {currentUser?.lastName?.charAt(0)}
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-white">
            {currentUser?.firstName} {currentUser?.lastName}
          </p>
          <button
            onClick={logout}
            className="flex items-center text-xs font-medium text-indigo-200 hover:text-white"
          >
            <BiLogOut className="mr-1 h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar panel */}
        <div className="fixed inset-0 flex z-40">
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-indigo-700">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <BiX className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-2xl font-bold text-white">PackPal</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                <Navigation />
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-indigo-800 p-4">
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Update the exported Navigation component
Sidebar.Navigation = () => {
  const [hasCompletedEvents, setHasCompletedEvents] = useState(false);
  const { refreshTrigger } = useContext(SidebarContext) || { refreshTrigger: 0 };
  const location = useLocation();
  
  // Check if user has any completed events
  useEffect(() => {
    const checkCompletedEvents = async () => {
      try {
        const response = await eventService.getCompletedEvents();
        if (response.data && response.data.success && response.data.events) {
          setHasCompletedEvents(response.data.events.length > 0);
        }
      } catch (error) {
        console.error("Error checking completed events:", error);
      }
    };
    
    checkCompletedEvents();
  }, [refreshTrigger, location.pathname]); // Re-check when location or refreshTrigger changes
  
  return (
    <>
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex items-center px-2 py-2 text-sm font-medium rounded-md ${
            isActive
              ? 'bg-indigo-800 text-white'
              : 'text-indigo-100 hover:bg-indigo-600'
          }`
        }
      >
        <BiHome className="mr-3 h-6 w-6" />
        Dashboard
      </NavLink>
      
      {hasCompletedEvents && (
        <NavLink
          to="/completed-events"
          className={({ isActive }) =>
            `flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              isActive
                ? 'bg-indigo-800 text-white'
                : 'text-indigo-100 hover:bg-indigo-600'
            }`
          }
        >
          <BiCheck className="mr-3 h-6 w-6" />
          Completed Events
        </NavLink>
      )}
      
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex items-center px-2 py-2 text-sm font-medium rounded-md ${
            isActive
              ? 'bg-indigo-800 text-white'
              : 'text-indigo-100 hover:bg-indigo-600'
          }`
        }
      >
        <BiUser className="mr-3 h-6 w-6" />
        Profile
      </NavLink>
    </>
  );
};

Sidebar.UserDropdown = () => {
  const { currentUser, logout } = useAuth();
  
  return (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-indigo-800 flex items-center justify-center text-white">
          {currentUser?.firstName?.charAt(0)}
          {currentUser?.lastName?.charAt(0)}
        </div>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-white">
          {currentUser?.firstName} {currentUser?.lastName}
        </p>
        <button
          onClick={logout}
          className="flex items-center text-xs font-medium text-indigo-200 hover:text-white"
        >
          <BiLogOut className="mr-1 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 