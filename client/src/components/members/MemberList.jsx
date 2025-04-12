import React, { useState } from 'react';
import { BiCrown, BiX, BiUserPlus } from 'react-icons/bi';
import { eventService } from '../../services/api.js';

const MemberList = ({ members, currentUserId, isOwner, eventId, onMemberRemoved }) => {
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [promotingMemberId, setPromotingMemberId] = useState(null);

  // Sort members by role importance
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'member':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      setRemovingMemberId(memberId);
      const response = await eventService.removeMember(eventId, memberId);
      if (response.data && response.data.success) {
        alert('Member removed successfully');
        // Call the callback if provided to refresh the members list
        if (onMemberRemoved) {
          onMemberRemoved();
        }
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setRemovingMemberId(null);
    }
  };
  
  const handlePromoteToAdmin = async (memberId) => {
    try {
      setPromotingMemberId(memberId);
      // We need to create this endpoint on the server
      const response = await eventService.updateMemberRole(eventId, memberId, 'admin');
      if (response.data && response.data.success) {
        alert('Member promoted to admin successfully');
        // Call the callback if provided to refresh the members list
        if (onMemberRemoved) {
          onMemberRemoved();
        }
      }
    } catch (error) {
      console.error('Error promoting member:', error);
      alert('Failed to promote member: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setPromotingMemberId(null);
    }
  };

  // Check if user can remove members (owner or admin)
  const canRemoveMembers = () => {
    const currentUserMember = members.find(m => m.userId === currentUserId);
    return currentUserMember && (currentUserMember.role === 'owner' || currentUserMember.role === 'admin');
  };
  
  // Check if user is the owner (only owner can promote to admin)
  const isEventOwner = () => {
    const currentUserMember = members.find(m => m.userId === currentUserId);
    return currentUserMember && currentUserMember.role === 'owner';
  };

  return (
    <ul className="divide-y divide-gray-200">
      {sortedMembers.map((member) => (
        <li key={member.userId} className="py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {member.role === 'owner' ? (
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    {member.user.firstName.charAt(0)}
                    {member.user.lastName.charAt(0)}
                  </div>
                  <BiCrown className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  {member.user.firstName.charAt(0)}
                  {member.user.lastName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {member.user.firstName} {member.user.lastName}
                {member.userId === currentUserId && ' (You)'}
              </p>
              <p className="text-sm text-gray-500 truncate">{member.user.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(member.role)}`}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
              
              {/* Promote to admin button - shown only if user is owner and target is a regular member */}
              {isEventOwner() && member.role === 'member' && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to promote ${member.user.firstName} ${member.user.lastName} to admin?`)) {
                      handlePromoteToAdmin(member.id);
                    }
                  }}
                  disabled={promotingMemberId === member.id}
                  className="text-indigo-500 hover:text-indigo-700 focus:outline-none"
                  title="Promote to admin"
                >
                  {promotingMemberId === member.id ? (
                    <span className="text-xs">Promoting...</span>
                  ) : (
                    <BiUserPlus className="h-5 w-5" />
                  )}
                </button>
              )}
              
              {/* Remove member button - shown only if user can remove members and target is not owner */}
              {canRemoveMembers() && member.role !== 'owner' && member.userId !== currentUserId && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to remove ${member.user.firstName} ${member.user.lastName} from this event?`)) {
                      handleRemoveMember(member.id);
                    }
                  }}
                  disabled={removingMemberId === member.id}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  title="Remove member"
                >
                  {removingMemberId === member.id ? (
                    <span className="text-xs">Removing...</span>
                  ) : (
                    <BiX className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default MemberList; 