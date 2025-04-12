import React from 'react';
import { BiCrown } from 'react-icons/bi';

const MemberList = ({ members, currentUserId, isOwner }) => {
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
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(member.role)}`}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default MemberList; 