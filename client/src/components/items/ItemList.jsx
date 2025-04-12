import React from 'react';
import ItemStatusBadge from './ItemStatusBadge';
import { BiPencil, BiTrash } from 'react-icons/bi';
import { itemService } from '../../services/api';

const ItemList = ({ items, members, isEditable, currentUserId, onEditItem, onDeleteItem }) => {
  const updateItemStatus = async (itemId, newStatus) => {
    try {
      await itemService.updateItemStatus(itemId, newStatus);
      
      // Since we don't have sockets now, we would need to refresh the data
      // This could be handled by passing a callback to refresh the parent component
      // or implementing a more sophisticated state management approach
      // For now, we'll just show an alert
      alert('Status updated successfully! Refresh the page to see changes.');
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const getAssignedToName = (assignedToId) => {
    const member = members.find(m => m.userId === assignedToId);
    return member 
      ? `${member.user.firstName} ${member.user.lastName}`
      : 'Unassigned';
  };
  
  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No items found in this category.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getAssignedToName(item.assignedToId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(isEditable || item.assignedToId === currentUserId) ? (
                    <select
                      value={item.status}
                      onChange={(e) => updateItemStatus(item.id, e.target.value)}
                      className="block w-full pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="packed">Packed</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  ) : (
                    <ItemStatusBadge status={item.status} />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {isEditable && (
                    <div className="flex justify-end space-x-2">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => onEditItem && onEditItem(item)}
                        aria-label="Edit item"
                      >
                        <BiPencil className="h-5 w-5" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => onDeleteItem && onDeleteItem(item)}
                        aria-label="Delete item"
                      >
                        <BiTrash className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemList; 