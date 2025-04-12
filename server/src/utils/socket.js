const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { db } = require('../db/index');
const { users, events } = require('../db/schema');
const { eq } = require('drizzle-orm');

// Store active connections
let io;
const connectedUsers = new Map();
const userRooms = new Map();

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const userResults = await db.select().from(users).where(eq(users.id, decoded.id));
      
      if (!userResults.length) {
        return next(new Error('Authentication error: User not found'));
      }

      const user = userResults[0];

      if (!user.isActive) {
        return next(new Error('Authentication error: User inactive'));
      }

      // Attach user to socket
      socket.user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Add user to connected users map
    connectedUsers.set(socket.user.id, socket);
    
    // Join rooms for events the user is part of
    joinUserEvents(socket);

    // Event: Item status update
    socket.on('item:statusUpdate', async (data) => {
      try {
        const { eventId, itemId, isPacked } = data;
        
        // Check if user is in the event room
        if (userRooms.has(socket.user.id) && 
            userRooms.get(socket.user.id).includes(`event:${eventId}`)) {
          
          // Broadcast to other users in the event room
          socket.to(`event:${eventId}`).emit('item:statusUpdated', {
            itemId,
            isPacked,
            updatedBy: {
              id: socket.user.id,
              name: `${socket.user.firstName} ${socket.user.lastName}`
            },
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Socket item status update error:', error);
      }
    });

    // Event: Join event room when selected
    socket.on('event:join', (eventId) => {
      socket.join(`event:${eventId}`);
      // Add to user's rooms
      if (!userRooms.has(socket.user.id)) {
        userRooms.set(socket.user.id, []);
      }
      userRooms.get(socket.user.id).push(`event:${eventId}`);
      
      socket.emit('event:joined', { eventId });
    });

    // Event: Leave event room
    socket.on('event:leave', (eventId) => {
      socket.leave(`event:${eventId}`);
      // Remove from user's rooms
      if (userRooms.has(socket.user.id)) {
        userRooms.set(
          socket.user.id,
          userRooms.get(socket.user.id).filter(room => room !== `event:${eventId}`)
        );
      }
    });

    // Event: Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
      connectedUsers.delete(socket.user.id);
      userRooms.delete(socket.user.id);
    });
  });

  return io;
};

// Join user to their event rooms
const joinUserEvents = async (socket) => {
  try {
    // Get user's events (where they are the owner)
    const userEvents = await db.select({ id: events.id })
      .from(events)
      .where(eq(events.ownerId, socket.user.id));

    // Join each event room
    const rooms = [];
    for (const event of userEvents) {
      const roomName = `event:${event.id}`;
      socket.join(roomName);
      rooms.push(roomName);
    }

    // Store user's rooms
    userRooms.set(socket.user.id, rooms);
  } catch (error) {
    console.error('Error joining user events:', error);
  }
};

// Send a notification to all users in an event
const notifyEventMembers = (eventId, notification) => {
  if (!io) return;

  io.to(`event:${eventId}`).emit('notification', {
    ...notification,
    eventId
  });
};

module.exports = {
  initializeSocket,
  notifyEventMembers,
  getIO: () => io
}; 