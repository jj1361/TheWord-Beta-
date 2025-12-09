/**
 * User Editor Component
 * Allows admins to edit user profiles and roles
 */

import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types/user';

interface UserEditorProps {
  user: UserProfile;
  currentUserId: string;
  onUpdate: (uid: string, updates: { displayName?: string; role?: UserRole }) => void;
  onDelete: (uid: string) => void;
  onCancel: () => void;
}

const UserEditor: React.FC<UserEditorProps> = ({
  user,
  currentUserId,
  onUpdate,
  onDelete,
  onCancel,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [role, setRole] = useState<UserRole>(user.role);

  const isCurrentUser = user.uid === currentUserId;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: { displayName?: string; role?: UserRole } = {};

    if (displayName !== user.displayName) {
      updates.displayName = displayName;
    }
    if (role !== user.role && !isCurrentUser) {
      updates.role = role;
    }

    if (Object.keys(updates).length > 0) {
      onUpdate(user.uid, updates);
    } else {
      onCancel();
    }
  };

  return (
    <div className="user-editor">
      <button className="user-editor-back" onClick={onCancel}>
        &larr; Back to list
      </button>

      <div className="user-editor-header">
        <div className="user-editor-avatar">
          {user.displayName
            ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : user.email[0].toUpperCase()}
        </div>
        <div className="user-editor-title">
          <h3>{user.displayName || user.email}</h3>
          <span className={`role-badge ${user.role}`}>{user.role}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="user-editor-form">
        <div className="form-group">
          <label>Email</label>
          <input type="text" value={user.email} disabled className="disabled-input" />
        </div>

        <div className="form-group">
          <label htmlFor="edit-display-name">Display Name</label>
          <input
            id="edit-display-name"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Enter display name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-role">Role</label>
          <select
            id="edit-role"
            value={role}
            onChange={e => setRole(e.target.value as UserRole)}
            disabled={isCurrentUser}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          {isCurrentUser && (
            <span className="form-hint">You cannot change your own role</span>
          )}
        </div>

        <div className="user-editor-meta">
          <div className="meta-item">
            <span className="meta-label">User ID:</span>
            <span className="meta-value">{user.uid}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Created:</span>
            <span className="meta-value">{formatDate(user.createdAt)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Last Login:</span>
            <span className="meta-value">{formatDate(user.lastLoginAt)}</span>
          </div>
        </div>

        <div className="user-editor-actions">
          <button type="submit" className="save-btn">
            Save Changes
          </button>
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>

        {!isCurrentUser && (
          <div className="user-editor-danger">
            <h4>Danger Zone</h4>
            <p>Deleting a user will permanently remove their account and all associated data.</p>
            <button
              type="button"
              className="delete-btn"
              onClick={() => onDelete(user.uid)}
            >
              Delete User
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default UserEditor;
