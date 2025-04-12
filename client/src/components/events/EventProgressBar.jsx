import React from 'react';

const EventProgressBar = ({ status = 'planning' }) => {
  // Define the possible statuses and their order
  const statuses = ['planning', 'active', 'packing', 'ended'];
  
  // Find the current status index
  const currentIndex = statuses.indexOf(status);
  
  // Format status for display
  const formatStatus = (status) => {
    switch(status) {
      case 'planning': return 'Planning';
      case 'active': return 'Active';
      case 'packing': return 'Packing';
      case 'ended': return 'Delivered';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Get appropriate icon for each status
  const getStatusIcon = (statusItem, index, currentIndex) => {
    if (index <= currentIndex) {
      // For completed steps, show checkmark
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    
    // Show numbered icons for future steps
    return <span>{index + 1}</span>;
  };

  return (
    <div className="w-full py-4">
      {/* Progress bar container */}
      <div className="relative pb-12">
        {/* Progress bar line */}
        <div className="absolute top-7 left-0 right-0 h-1 bg-gray-200"></div>
        
        {/* Completed progress line */}
        <div 
          className="absolute top-7 left-0 h-1 bg-teal-500 transition-all duration-500"
          style={{ width: `${Math.max(0, (currentIndex / (statuses.length - 1)) * 100)}%` }}
        ></div>
        
        {/* Status points */}
        <div className="relative flex justify-between">
          {statuses.map((statusItem, index) => (
            <div key={statusItem} className="flex flex-col items-center">
              {/* Status circle */}
              <div 
                className={`rounded-full h-14 w-14 flex items-center justify-center z-10 border-2 shadow-md ${
                  index < currentIndex 
                    ? 'bg-teal-500 border-teal-600 text-white' 
                    : index === currentIndex
                    ? 'bg-teal-500 border-teal-600 text-white animate-pulse'
                    : 'bg-gray-200 border-gray-300 text-gray-500'
                }`}
              >
                {getStatusIcon(statusItem, index, currentIndex)}
              </div>
              
              {/* Status label */}
              <div className={`mt-4 text-sm font-medium ${
                index <= currentIndex ? 'text-teal-600 font-semibold' : 'text-gray-500'
              }`}>
                {formatStatus(statusItem)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventProgressBar; 