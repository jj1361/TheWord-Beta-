/**
 * Admin Panel Component
 * Allows admins to manage users, view stats, and perform admin tasks
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { UserProfile, UserRole } from '../../types/user';
import UserList from './UserList';
import UserEditor from './UserEditor';
import './AdminPanel.css';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users');

  // Load users on mount
  useEffect(() => {
    if (isOpen && isAdmin) {
      setUsers(authService.getUsers());
    }
  }, [isOpen, isAdmin]);

  // Don't render if not admin or not open
  if (!isOpen || !isAdmin) return null;

  const handleUpdateUser = (uid: string, updates: { displayName?: string; role?: UserRole }) => {
    try {
      const updatedUser = authService.updateProfile(uid, updates);
      if (updatedUser) {
        setUsers(authService.getUsers());
        setSelectedUser(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = (uid: string) => {
    if (uid === user?.uid) {
      alert('You cannot delete your own account from the admin panel');
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      authService.deleteUser(uid);
      setUsers(authService.getUsers());
      setSelectedUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  // Calculate stats
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const memberCount = users.filter(u => u.role === 'member').length;
  const recentUsers = users.filter(u => Date.now() - u.createdAt < 7 * 24 * 60 * 60 * 1000).length;

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>Admin Panel</h2>
          <button className="admin-panel-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="admin-panel-tabs">
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </div>

        <div className="admin-panel-content">
          {activeTab === 'users' && (
            <>
              {selectedUser ? (
                <UserEditor
                  user={selectedUser}
                  currentUserId={user?.uid || ''}
                  onUpdate={handleUpdateUser}
                  onDelete={handleDeleteUser}
                  onCancel={() => setSelectedUser(null)}
                />
              ) : (
                <UserList
                  users={users}
                  currentUserId={user?.uid || ''}
                  onSelectUser={setSelectedUser}
                />
              )}
            </>
          )}

          {activeTab === 'stats' && (
            <div className="admin-stats">
              <div className="stat-card">
                <span className="stat-value">{totalUsers}</span>
                <span className="stat-label">Total Users</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{adminCount}</span>
                <span className="stat-label">Admins</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{memberCount}</span>
                <span className="stat-label">Members</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{recentUsers}</span>
                <span className="stat-label">New This Week</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
