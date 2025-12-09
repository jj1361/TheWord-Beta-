import React from 'react';
import './YouthToggle.css';

interface YouthToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const YouthToggle: React.FC<YouthToggleProps> = ({ isEnabled, onToggle }) => {
  return (
    <div className="youth-toggle-container">
      <label className="youth-toggle">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="youth-toggle-slider">
          <span className="youth-toggle-icon youth-toggle-icon-off">Aa</span>
          <span className="youth-toggle-icon youth-toggle-icon-on">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </span>
        </span>
        <span className="youth-toggle-label">Youth Mode</span>
      </label>
    </div>
  );
};

export default YouthToggle;
