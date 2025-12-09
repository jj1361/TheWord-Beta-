/**
 * Auth Button Component
 * Shows login button when logged out, user menu when logged in
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

interface AuthButtonProps {
  onLoginClick: () => void;
  onAdminClick?: () => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ onLoginClick, onAdminClick }) => {
  const { user, signOut, isAdmin } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button className="auth-header-btn login-btn" onClick={onLoginClick}>
        Sign In
      </button>
    );
  }

  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className="auth-user-menu" ref={dropdownRef}>
      <button
        className="auth-user-avatar"
        onClick={() => setShowDropdown(!showDropdown)}
        title={user.displayName || user.email}
      >
        {initials}
      </button>

      {showDropdown && (
        <div className="auth-dropdown">
          <div className="auth-dropdown-header">
            <span className="auth-dropdown-name">{user.displayName || 'User'}</span>
            <span className="auth-dropdown-email">{user.email}</span>
            {isAdmin && <span className="auth-dropdown-role">Admin</span>}
          </div>

          <div className="auth-dropdown-divider" />

          {isAdmin && onAdminClick && (
            <button
              className="auth-dropdown-item"
              onClick={() => {
                setShowDropdown(false);
                onAdminClick();
              }}
            >
              Admin Panel
            </button>
          )}

          <button
            className="auth-dropdown-item logout"
            onClick={() => {
              setShowDropdown(false);
              signOut();
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthButton;
