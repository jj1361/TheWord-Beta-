/**
 * User List Component
 * Displays all users for admin management
 */

import React from 'react';
import { UserProfile } from '../../types/user';

interface UserListProps {
  users: UserProfile[];
  currentUserId: string;
  onSelectUser: (user: UserProfile) => void;
}

const UserList: React.FC<UserListProps> = ({ users, currentUserId, onSelectUser }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sortedUsers = [...users].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="user-list">
      <div className="user-list-header">
        <span className="user-count">{users.length} user{users.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="user-list-items">
        {sortedUsers.map(user => (
          <div
            key={user.uid}
            className={`user-list-item ${user.uid === currentUserId ? 'current-user' : ''}`}
            onClick={() => onSelectUser(user)}
          >
            <div className="user-avatar">
              {user.displayName
                ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : user.email[0].toUpperCase()}
            </div>

            <div className="user-info">
              <div className="user-name">
                {user.displayName || 'No name'}
                {user.uid === currentUserId && <span className="you-badge">You</span>}
              </div>
              <div className="user-email">{user.email}</div>
            </div>

            <div className="user-meta">
              <span className={`role-badge ${user.role}`}>{user.role}</span>
              <span className="user-date">Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="user-list-empty">
          No users found
        </div>
      )}
    </div>
  );
};

export default UserList;
