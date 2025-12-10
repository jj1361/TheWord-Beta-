import React from 'react';
import HistoryDropdown from './HistoryDropdown';
import BookmarksPanel from './BookmarksPanel';
import { HistoryEntry, Bookmark } from '../types/history';
import './Sidebar.css';

interface SidebarProps {
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
  // Auth props
  isSignedIn: boolean;
  onSignInClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
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
  // History props
  navigationHistory,
  historyIndex,
  onNavigateToHistoryEntry,
  onClearHistory,
  // Bookmarks props
  bookmarks,
  currentBookId,
  currentChapter,
  currentVerse,
  onNavigateToBookmark,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateBookmarkLabel,
  // Notes props
  showNotesPanel,
  notesCount,
  onToggleNotesPanel,
  // Presentation props
  onTogglePresentation,
  // Auth props
  isSignedIn,
  onSignInClick,
}) => {
  const [showNotesTooltip, setShowNotesTooltip] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  // Sidebar is always collapsible
  const isCollapsible = true;

  return (
    <div
      className={`sidebar-container ${isCollapsible ? 'collapsible' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => isCollapsible && setIsHovered(true)}
      onMouseLeave={() => isCollapsible && setIsHovered(false)}
    >
      {/* Hover trigger zone - only visible when collapsible */}
      {isCollapsible && (
        <div className="sidebar-hover-trigger" />
      )}
      <div className={`sidebar ${screenShareEnabled ? 'screen-share-mode' : ''} ${isCollapsible ? 'collapsible-sidebar' : ''}`}>
      <div className="sidebar-content">
        <button
          className={`sidebar-btn ${useProtoSinaitic ? 'active' : ''}`}
          onClick={onToggleProtoSinaitic}
          title={useProtoSinaitic ? 'Switch to Modern Hebrew' : 'Switch to Proto-Sinaitic'}
        >
          {useProtoSinaitic ? '𐤀' : 'א'}
        </button>

        <button
          className={`sidebar-btn ${webcamEnabled ? 'active' : ''}`}
          onClick={onToggleWebcam}
          title={webcamEnabled ? 'Hide Camera' : 'Show Camera'}
        >
          {webcamEnabled ? '📹' : '📷'}
        </button>

        {webcamEnabled && (
          <>
            <button
              className="sidebar-btn"
              onClick={onToggleWebcamSettings}
              title="Webcam Settings"
            >
              ⚙️
            </button>
            <button
              className={`sidebar-btn ${webcamFullscreen ? 'active' : ''}`}
              onClick={onToggleWebcamFullscreen}
              title={webcamFullscreen ? 'Exit Fullscreen' : 'Fullscreen Webcam'}
            >
              {webcamFullscreen ? '⊡' : '⊞'}
            </button>
          </>
        )}

        <button
          className={`sidebar-btn ${screenShareEnabled ? 'active' : ''}`}
          onClick={onToggleScreenShare}
          title={screenShareEnabled ? 'Stop Screen Share' : 'Share Screen'}
        >
          {screenShareEnabled ? '🖥️' : '📺'}
        </button>

        {screenShareEnabled && (
          <button
            className={`sidebar-btn ${screenShareWithVerses ? 'active' : ''}`}
            onClick={onToggleScreenShareWithVerses}
            title={screenShareWithVerses ? 'Hide Verses' : 'Show Verses'}
          >
            {screenShareWithVerses ? '📖' : '📜'}
          </button>
        )}

        <button
          className="sidebar-btn presentation-btn"
          onClick={onTogglePresentation}
          title="View Presentation"
        >
          📊
        </button>

        <div className="sidebar-divider"></div>

        <button
          className={`sidebar-btn study-btn ${studyMode ? 'active' : ''}`}
          onClick={onToggleStudyMode}
          title={studyMode ? 'Hide Study Notes' : 'Show Study Notes'}
        >
          {studyMode ? '📚' : '📖'}
        </button>

        <button
          className={`sidebar-btn person-profile-btn ${personProfileEnabled ? 'active' : ''}`}
          onClick={onTogglePersonProfile}
          title={personProfileEnabled ? 'Disable Person Profiles' : 'Enable Person Profiles'}
        >
          {personProfileEnabled ? '👤' : '👥'}
        </button>

        <button
          className={`sidebar-btn youth-btn ${youthMode ? 'active' : ''}`}
          onClick={onToggleYouthMode}
          title={youthMode ? 'Disable Youth Mode' : 'Enable Youth Mode'}
        >
          {youthMode ? '🎨' : '👶'}
        </button>

        <div className="sidebar-divider"></div>

        {/* History Dropdown */}
        <div className="sidebar-component-wrapper">
          <HistoryDropdown
            history={navigationHistory}
            currentIndex={historyIndex}
            onNavigate={onNavigateToHistoryEntry}
            onClearHistory={onClearHistory}
          />
        </div>

        {/* Bookmarks Panel */}
        <div className="sidebar-component-wrapper">
          <BookmarksPanel
            bookmarks={bookmarks}
            currentBookId={currentBookId}
            currentChapter={currentChapter}
            currentVerse={currentVerse}
            onNavigate={onNavigateToBookmark}
            onAddBookmark={onAddBookmark}
            onRemoveBookmark={onRemoveBookmark}
            onUpdateLabel={onUpdateBookmarkLabel}
            disabled={!isSignedIn}
            onSignInClick={onSignInClick}
          />
        </div>

        {/* Notes Toggle */}
        <div
          className="sidebar-component-wrapper notes-toggle-wrapper"
          onMouseEnter={() => !isSignedIn && setShowNotesTooltip(true)}
          onMouseLeave={() => setShowNotesTooltip(false)}
        >
          <button
            className={`sidebar-btn notes-btn ${showNotesPanel ? 'active' : ''} ${!isSignedIn ? 'disabled' : ''}`}
            onClick={() => isSignedIn && onToggleNotesPanel()}
            title={isSignedIn ? 'Notes & Highlights' : ''}
            aria-label="Toggle notes panel"
          >
            📝
            {notesCount > 0 && isSignedIn && (
              <span className="sidebar-badge">{notesCount}</span>
            )}
          </button>
          {showNotesTooltip && !isSignedIn && (
            <div className="sidebar-signin-tooltip">
              <p>Sign in to save notes</p>
              <button className="signin-tooltip-btn" onClick={onSignInClick}>
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          className={`sidebar-btn theme-btn ${darkMode ? 'active' : ''}`}
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
      </div>
    </div>
  );
};

export default Sidebar;
