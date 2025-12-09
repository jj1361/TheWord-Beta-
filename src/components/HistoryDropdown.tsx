import React, { useState, useRef, useEffect } from 'react';
import { HistoryEntry } from '../types/history';
import './HistoryDropdown.css';

interface HistoryDropdownProps {
  history: HistoryEntry[];
  currentIndex: number;
  onNavigate: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
}

const HistoryDropdown: React.FC<HistoryDropdownProps> = ({
  history,
  currentIndex,
  onNavigate,
  onClearHistory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const filteredHistory = history.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.bookName.toLowerCase().includes(query) ||
      entry.osisRef.toLowerCase().includes(query) ||
      `chapter ${entry.chapter}`.includes(query)
    );
  });

  // Group history by book for better organization
  const groupedHistory = filteredHistory.reduce((acc, entry, index) => {
    const key = entry.bookName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push({ entry, originalIndex: history.indexOf(entry) });
    return acc;
  }, {} as Record<string, Array<{ entry: HistoryEntry; originalIndex: number }>>);

  const handleNavigate = (entry: HistoryEntry) => {
    onNavigate(entry);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your history?')) {
      onClearHistory();
      setIsOpen(false);
    }
  };

  return (
    <div className="history-dropdown" ref={dropdownRef}>
      <button
        className="history-dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="View history"
        aria-label="View navigation history"
      >
        📜
        {history.length > 0 && (
          <span className="history-count">{history.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="history-dropdown-menu">
          <div className="history-dropdown-header">
            <h3>Recent History</h3>
            {history.length > 0 && (
              <button
                className="clear-history-btn"
                onClick={handleClearHistory}
                title="Clear all history"
              >
                Clear All
              </button>
            )}
          </div>

          {history.length > 0 && (
            <div className="history-search">
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="history-search-input"
              />
            </div>
          )}

          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-empty">
                <p>No history yet</p>
                <span className="history-empty-icon">📚</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="history-empty">
                <p>No matches found</p>
              </div>
            ) : (
              Object.entries(groupedHistory).map(([bookName, entries]) => (
                <div key={bookName} className="history-book-group">
                  <div className="history-book-name">{bookName}</div>
                  {entries.map(({ entry, originalIndex }) => (
                    <div
                      key={`${entry.osisRef}-${entry.timestamp}`}
                      className={`history-item ${originalIndex === currentIndex ? 'current' : ''}`}
                      onClick={() => handleNavigate(entry)}
                    >
                      <div className="history-item-main">
                        <span className="history-item-ref">
                          Chapter {entry.chapter}
                          {entry.verse && ` : ${entry.verse}`}
                        </span>
                        {originalIndex === currentIndex && (
                          <span className="history-item-badge">Current</span>
                        )}
                      </div>
                      <span className="history-item-time">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryDropdown;
