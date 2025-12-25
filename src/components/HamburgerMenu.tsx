import React, { useState, useEffect, useRef } from 'react';
import HistoryDropdown from './HistoryDropdown';
import BookmarksPanel from './BookmarksPanel';
import { HistoryEntry, Bookmark } from '../types/history';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
  useProtoSinaitic: boolean;
  webcamEnabled: boolean;
  webcamFullscreen: boolean;
  screenShareEnabled: boolean;
  screenShareWithVerses: boolean;
  youthMode: boolean;
  studyMode: boolean;
  darkMode: boolean;
  personProfileEnabled: boolean;
  onToggleProtoSinaitic: () => void;
  onToggleWebcam: () => void;
  onToggleWebcamSettings: () => void;
  onToggleWebcamFullscreen: () => void;
  onToggleScreenShare: () => void;
  onToggleScreenShareWithVerses: () => void;
  onToggleYouthMode: () => void;
  onToggleStudyMode: () => void;
  onToggleDarkMode: () => void;
  onTogglePersonProfile: () => void;
  // History props
  navigationHistory: HistoryEntry[];
  historyIndex: number;
  onNavigateToHistoryEntry: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  // Bookmarks props
  bookmarks: Bookmark[];
  currentBookId: number;
  currentChapter: number;
  currentVerse?: number;
  onNavigateToBookmark: (bookmark: Bookmark) => void;
  onAddBookmark: (label?: string) => void;
  onRemoveBookmark: (id: string) => void;
  onUpdateBookmarkLabel: (id: string, label: string) => void;
  // Notes props
  showNotesPanel: boolean;
  notesCount: number;
  onToggleNotesPanel: () => void;
  // Presentation props
  onTogglePresentation: () => void;
  onToggleScripturePresentation: () => void;
  // Media control props
  onToggleMediaControl: () => void;
  // Auth props
  isSignedIn: boolean;
  onSignInClick: () => void;
  // Text size props
  textSize: number;
  minTextSize: number;
  maxTextSize: number;
  onIncreaseTextSize: () => void;
  onDecreaseTextSize: () => void;
}

interface MenuItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  badge?: number;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, active, onClick, disabled, badge }) => (
  <button
    className={`hamburger-menu-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
    onClick={onClick}
    disabled={disabled}
  >
    <span className="menu-item-icon">{icon}</span>
    <span className="menu-item-label">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="menu-item-badge">{badge}</span>
    )}
    {active && <span className="menu-item-check">✓</span>}
  </button>
);

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, children }) => (
  <div className="hamburger-menu-section">
    <div className="menu-section-title">{title}</div>
    <div className="menu-section-content">{children}</div>
  </div>
);

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  useProtoSinaitic,
  webcamEnabled,
  webcamFullscreen,
  screenShareEnabled,
  screenShareWithVerses,
  youthMode,
  studyMode,
  darkMode,
  personProfileEnabled,
  onToggleProtoSinaitic,
  onToggleWebcam,
  onToggleWebcamSettings,
  onToggleWebcamFullscreen,
  onToggleScreenShare,
  onToggleScreenShareWithVerses,
  onToggleYouthMode,
  onToggleStudyMode,
  onToggleDarkMode,
  onTogglePersonProfile,
  navigationHistory,
  historyIndex,
  onNavigateToHistoryEntry,
  onClearHistory,
  bookmarks,
  currentBookId,
  currentChapter,
  currentVerse,
  onNavigateToBookmark,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateBookmarkLabel,
  showNotesPanel,
  notesCount,
  onToggleNotesPanel,
  onTogglePresentation,
  onToggleScripturePresentation,
  onToggleMediaControl,
  isSignedIn,
  onSignInClick,
  textSize,
  minTextSize,
  maxTextSize,
  onIncreaseTextSize,
  onDecreaseTextSize,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [, setActiveSubmenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setActiveSubmenu(null);
    }
  };

  const handleItemClick = (action: () => void) => {
    action();
    // Don't close menu for toggle items - let user toggle multiple settings
  };

  const handleNavigationItem = (action: () => void) => {
    action();
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  return (
    <div className="hamburger-menu-container" ref={menuRef}>
      {/* Hamburger Button */}
      <button
        className={`hamburger-button ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Overlay */}
      <div className={`hamburger-overlay ${isOpen ? 'visible' : ''}`} onClick={() => setIsOpen(false)} />

      {/* Menu Panel */}
      <div className={`hamburger-panel ${isOpen ? 'open' : ''}`}>
        <div className="hamburger-panel-header">
          <h2>Menu</h2>
          <button className="hamburger-close-btn" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>

        <div className="hamburger-panel-content">
          {/* Display Settings */}
          <MenuSection title="Display">
            <MenuItem
              icon={useProtoSinaitic ? '𐤀' : 'א'}
              label={useProtoSinaitic ? 'Proto-Sinaitic' : 'Modern Hebrew'}
              active={useProtoSinaitic}
              onClick={() => handleItemClick(onToggleProtoSinaitic)}
            />
            <MenuItem
              icon={darkMode ? '☀️' : '🌙'}
              label={darkMode ? 'Light Mode' : 'Dark Mode'}
              active={darkMode}
              onClick={() => handleItemClick(onToggleDarkMode)}
            />

            {/* Text Size Control */}
            <div className="menu-text-size-control">
              <span className="menu-item-icon">Aa</span>
              <span className="menu-item-label">Text Size</span>
              <div className="text-size-buttons">
                <button
                  className="text-size-btn"
                  onClick={() => handleItemClick(onDecreaseTextSize)}
                  disabled={textSize <= minTextSize}
                >
                  −
                </button>
                <span className="text-size-value">{textSize}</span>
                <button
                  className="text-size-btn"
                  onClick={() => handleItemClick(onIncreaseTextSize)}
                  disabled={textSize >= maxTextSize}
                >
                  +
                </button>
              </div>
            </div>
          </MenuSection>

          {/* Study Tools */}
          <MenuSection title="Study Tools">
            <MenuItem
              icon={studyMode ? '📚' : '📖'}
              label="Study Mode"
              active={studyMode}
              onClick={() => handleItemClick(onToggleStudyMode)}
            />
            <MenuItem
              icon={personProfileEnabled ? '👤' : '👥'}
              label="Person Profiles"
              active={personProfileEnabled}
              onClick={() => handleItemClick(onTogglePersonProfile)}
            />
            <MenuItem
              icon={youthMode ? '🎨' : '👶'}
              label="Youth Mode"
              active={youthMode}
              onClick={() => handleItemClick(onToggleYouthMode)}
            />
          </MenuSection>

          {/* Navigation */}
          <MenuSection title="Navigation">
            <div className="menu-embedded-component">
              <div className="embedded-component-label">
                <span className="menu-item-icon">🕐</span>
                <span>History</span>
              </div>
              <HistoryDropdown
                history={navigationHistory}
                currentIndex={historyIndex}
                onNavigate={(entry) => handleNavigationItem(() => onNavigateToHistoryEntry(entry))}
                onClearHistory={onClearHistory}
              />
            </div>

            <div className="menu-embedded-component">
              <div className="embedded-component-label">
                <span className="menu-item-icon">🔖</span>
                <span>Bookmarks</span>
              </div>
              <BookmarksPanel
                bookmarks={bookmarks}
                currentBookId={currentBookId}
                currentChapter={currentChapter}
                currentVerse={currentVerse}
                onNavigate={(bookmark) => handleNavigationItem(() => onNavigateToBookmark(bookmark))}
                onAddBookmark={onAddBookmark}
                onRemoveBookmark={onRemoveBookmark}
                onUpdateLabel={onUpdateBookmarkLabel}
                disabled={!isSignedIn}
                onSignInClick={onSignInClick}
              />
            </div>

            <MenuItem
              icon="📝"
              label="Notes & Highlights"
              active={showNotesPanel}
              onClick={() => handleItemClick(onToggleNotesPanel)}
              disabled={!isSignedIn}
              badge={isSignedIn ? notesCount : undefined}
            />
            {!isSignedIn && (
              <div className="menu-signin-hint">
                <span>Sign in to access notes</span>
                <button className="menu-signin-btn" onClick={onSignInClick}>
                  Sign In
                </button>
              </div>
            )}
          </MenuSection>

          {/* Media & Presentation */}
          <MenuSection title="Media">
            <MenuItem
              icon={webcamEnabled ? '📹' : '📷'}
              label="Camera"
              active={webcamEnabled}
              onClick={() => handleItemClick(onToggleWebcam)}
            />
            {webcamEnabled && (
              <>
                <MenuItem
                  icon="⚙️"
                  label="Camera Settings"
                  onClick={() => handleItemClick(onToggleWebcamSettings)}
                />
                <MenuItem
                  icon={webcamFullscreen ? '⊡' : '⊞'}
                  label={webcamFullscreen ? 'Exit Fullscreen' : 'Fullscreen Camera'}
                  active={webcamFullscreen}
                  onClick={() => handleItemClick(onToggleWebcamFullscreen)}
                />
              </>
            )}
            <MenuItem
              icon={screenShareEnabled ? '🖥️' : '📺'}
              label="Screen Share"
              active={screenShareEnabled}
              onClick={() => handleItemClick(onToggleScreenShare)}
            />
            {screenShareEnabled && (
              <MenuItem
                icon={screenShareWithVerses ? '📖' : '📜'}
                label={screenShareWithVerses ? 'Hide Verses' : 'Show Verses'}
                active={screenShareWithVerses}
                onClick={() => handleItemClick(onToggleScreenShareWithVerses)}
              />
            )}
          </MenuSection>

          {/* Presentations */}
          <MenuSection title="Presentations">
            <MenuItem
              icon="📊"
              label="View Presentation"
              onClick={() => handleNavigationItem(onTogglePresentation)}
            />
            <MenuItem
              icon="🎬"
              label="Scripture View"
              onClick={() => handleNavigationItem(onToggleScripturePresentation)}
            />
            <MenuItem
              icon="🖥️"
              label="Media Control"
              onClick={() => handleNavigationItem(onToggleMediaControl)}
            />
          </MenuSection>
        </div>
      </div>
    </div>
  );
};

export default HamburgerMenu;
