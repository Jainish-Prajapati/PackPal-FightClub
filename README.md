# PackPal - Group Travel Packing Organization

PackPal is a full-stack MERN application designed to help groups organize and manage their packing lists for travel events.

## Features

- **User Management**: Four distinct roles (Owner, Admin, Member, Viewer) with appropriate permissions
- **Group Travel Events**: Create and manage travel events with details like name, dates, location, and purpose
- **Item Management**: Create categorized packing lists with detailed item properties and assignments
- **Real-time Updates**: Live status changes and notifications using Socket.io
- **Export Functionality**: Generate PDF packing lists and save trip templates

## Tech Stack

- **Frontend**: React with TypeScript, Bootstrap for responsive design
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Database Setup

1. Make sure PostgreSQL is running on your machine
2. The database 'packpal' should already be created

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASS=your_password
   DB_NAME=packpal
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d
   ```

4. Run database migrations:
   ```
   npm run db:migrate
   ```

5. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and visit `http://localhost:3000`

## API Documentation

The API provides the following endpoints:

- **Authentication**: `/api/auth`
- **Users**: `/api/users`
- **Events**: `/api/events`
- **Items**: `/api/items`
- **Categories**: `/api/categories`
- **Notifications**: `/api/notifications`

For detailed API documentation, refer to the API documentation in the backend directory.

## Recent Updates

### Item Status Feature
A new status field has been added to items. To apply this change, you need to run the database migration:

```sh
# Navigate to the server directory
cd server

# Run the migration
npm run db:migrate
```

This will add a status field to the items table and set initial values based on the existing isPacked field. 