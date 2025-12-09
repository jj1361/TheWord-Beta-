import React, { useState, useRef, useEffect } from 'react';
import { Bookmark } from '../types/history';
import './BookmarksPanel.css';

interface BookmarksPanelProps {
  bookmarks: Bookmark[];
  currentBookId: number;
  currentChapter: number;
  currentVerse?: number;
  onNavigate: (bookmark: Bookmark) => void;
  onAddBookmark: (label?: string) => void;
  onRemoveBookmark: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  disabled?: boolean;
  onSignInClick?: () => void;
}

const BookmarksPanel: React.FC<BookmarksPanelProps> = ({
  bookmarks,
  currentBookId,
  currentChapter,
  currentVerse,
  onNavigate,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateLabel,
  disabled,
  onSignInClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Check if current location is bookmarked
  const isCurrentBookmarked = bookmarks.some(
    b => b.bookId === currentBookId &&
         b.chapter === currentChapter &&
         b.verse === currentVerse
  );

  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bookmark.bookName.toLowerCase().includes(query) ||
      bookmark.osisRef.toLowerCase().includes(query) ||
      (bookmark.label && bookmark.label.toLowerCase().includes(query))
    );
  });

  const handleAddBookmark = () => {
    const label = window.prompt('Enter a label for this bookmark (optional):');
    onAddBookmark(label || undefined);
  };

  const handleStartEdit = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditLabel(bookmark.label || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateLabel(id, editLabel);
    setEditingId(null);
    setEditLabel('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const handleButtonClick = () => {
    if (disabled) {
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <div
      className="bookmarks-panel"
      ref={dropdownRef}
      onMouseEnter={() => disabled && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className={`bookmarks-toggle ${isCurrentBookmarked ? 'bookmarked' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleButtonClick}
        title={disabled ? '' : (isCurrentBookmarked ? 'Bookmarked' : 'Bookmarks')}
        aria-label="View bookmarks"
      >
        {isCurrentBookmarked ? '⭐' : '☆'}
        {bookmarks.length > 0 && !disabled && (
          <span className="bookmarks-count">{bookmarks.length}</span>
        )}
      </button>

      {/* Sign-in tooltip for disabled state */}
      {showTooltip && disabled && (
        <div className="signin-tooltip">
          <p>Sign in to save bookmarks</p>
          {onSignInClick && (
            <button className="signin-tooltip-btn" onClick={onSignInClick}>
              Sign In
            </button>
          )}
        </div>
      )}

      {isOpen && !disabled && (
        <div className="bookmarks-dropdown-menu">
          <div className="bookmarks-header">
            <h3>Bookmarks</h3>
            {!isCurrentBookmarked && (
              <button
                className="add-bookmark-btn"
                onClick={handleAddBookmark}
                title="Bookmark current location"
              >
                + Add
              </button>
            )}
          </div>

          {bookmarks.length > 0 && (
            <div className="bookmarks-search">
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bookmarks-search-input"
              />
            </div>
          )}

          <div className="bookmarks-list">
            {bookmarks.length === 0 ? (
              <div className="bookmarks-empty">
                <p>No bookmarks yet</p>
                <span className="bookmarks-empty-icon">⭐</span>
                <button
                  className="add-first-bookmark-btn"
                  onClick={handleAddBookmark}
                >
                  Bookmark this chapter
                </button>
              </div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="bookmarks-empty">
                <p>No matches found</p>
              </div>
            ) : (
              filteredBookmarks.map(bookmark => (
                <div
                  key={bookmark.id}
                  className="bookmark-item"
                >
                  <div
                    className="bookmark-content"
                    onClick={() => {
                      onNavigate(bookmark);
                      setIsOpen(false);
                    }}
                  >
                    <div className="bookmark-main">
                      {editingId === bookmark.id ? (
                        <div className="bookmark-edit">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            placeholder="Bookmark label"
                            className="bookmark-edit-input"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(bookmark.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <div className="bookmark-edit-actions">
                            <button
                              className="bookmark-edit-save"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit(bookmark.id);
                              }}
                            >
                              ✓
                            </button>
                            <button
                              className="bookmark-edit-cancel"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {bookmark.label && (
                            <div className="bookmark-label">{bookmark.label}</div>
                          )}
                          <div className="bookmark-ref">
                            {bookmark.bookName} {bookmark.chapter}
                            {bookmark.verse && `:${bookmark.verse}`}
                          </div>
                          <div className="bookmark-date">
                            {formatDate(bookmark.timestamp)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId !== bookmark.id && (
                    <div className="bookmark-actions">
                      <button
                        className="bookmark-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(bookmark);
                        }}
                        title="Edit label"
                      >
                        ✏️
                      </button>
                      <button
                        className="bookmark-action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Remove this bookmark?')) {
                            onRemoveBookmark(bookmark.id);
                          }
                        }}
                        title="Remove bookmark"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarksPanel;
