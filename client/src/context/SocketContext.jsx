import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found for socket connection');
      return;
    }

    // Initialize socket connection with token
    const newSocket = io({
      auth: {
        token
      },
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Listen for item updates
    newSocket.on('item:statusUpdated', (data) => {
      console.log('Item status updated:', data);
      // You can dispatch this to a state manager if needed
    });

    // Listen for notifications
    newSocket.on('notification', (data) => {
      console.log('Notification received:', data);
      // You can dispatch this to a notification system
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated]);

  // Function to join an event room
  const joinEvent = (eventId) => {
    if (socket && isConnected) {
      socket.emit('event:join', eventId);
    }
  };

  // Function to leave an event room
  const leaveEvent = (eventId) => {
    if (socket && isConnected) {
      socket.emit('event:leave', eventId);
    }
  };

  // Function to update item status
  const updateItemStatus = (eventId, itemId, isPacked) => {
    if (socket && isConnected) {
      socket.emit('item:statusUpdate', {
        eventId,
        itemId,
        isPacked
      });
    }
  };

  const value = {
    socket,
    isConnected,
    joinEvent,
    leaveEvent,
    updateItemStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 