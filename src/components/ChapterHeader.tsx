/**
 * ChapterHeader Component
 * Fixed header displaying current book and chapter with navigation controls
 * and feature toggle buttons
 */

import React, { useState } from 'react';
import { BIBLE_BOOKS } from '../types/bible';
import { HistoryEntry, Bookmark } from '../types/history';
import ChapterSelector from './ChapterSelector';
import NavigationModal from './NavigationModal';
import ExpandableSearchBox from './ExpandableSearchBox';
import HamburgerMenu from './HamburgerMenu';
import TranslationSelector from './TranslationSelector';
import { AuthButton } from './Auth';
import { SearchResponse } from '../services/searchService';
import { useQuiz } from '../contexts/QuizContext';
import './ChapterHeader.css';

interface ChapterHeaderProps {
  bookId: number;
  bookName: string;
  chapterNum: number;
  totalChapters: number;
  onChapterSelect: (chapter: number) => void;
  onNavigate: (bookId: number, chapter: number) => void;
  // Feature toggle props
  studyMode: boolean;
  onToggleStudyMode: () => void;
  showFootnotes: boolean;
  onToggleFootnotes: () => void;
  personProfileEnabled: boolean;
  onTogglePersonProfile: () => void;
  youthMode: boolean;
  onToggleYouthMode: () => void;
  showNotesPanel: boolean;
  onToggleNotesPanel: () => void;
  // Search props
  onSearch: (query: string) => Promise<SearchResponse>;
  onSearchResultClick: (bookId: number, chapter: number, verse: number) => void;
  onWordSearch?: (strongsId: string) => void;
  voiceSearchQuery?: string | null;
  onVoiceSearchHandled?: () => void;
  // HamburgerMenu props
  useProtoSinaitic: boolean;
  webcamEnabled: boolean;
  webcamFullscreen: boolean;
  screenShareEnabled: boolean;
  screenShareWithVerses: boolean;
  darkMode: boolean;
  theme?: 'light' | 'dark' | 'sepia';
  onToggleProtoSinaitic: () => void;
  onToggleWebcam: () => void;
  onToggleWebcamSettings: () => void;
  onToggleWebcamFullscreen: () => void;
  onToggleScreenShare: () => void;
  onToggleScreenShareWithVerses: () => void;
  onToggleDarkMode: () => void;
  onSetTheme?: (theme: 'light' | 'dark' | 'sepia') => void;
  // History props
  navigationHistory: HistoryEntry[];
  historyIndex: number;
  onNavigateToHistoryEntry: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  // Bookmarks props
  bookmarks: Bookmark[];
  currentVerse?: number;
  onNavigateToBookmark: (bookmark: Bookmark) => void;
  onAddBookmark: (label?: string) => void;
  onRemoveBookmark: (id: string) => void;
  onUpdateBookmarkLabel: (id: string, label: string) => void;
  // Notes props
  notesCount: number;
  // Presentation props
  onTogglePresentation: () => void;
  onToggleScripturePresentation: () => void;
  // Media control props
  onToggleMediaControl: () => void;
  // Auth props
  isSignedIn: boolean;
  onSignInClick: () => void;
  isAdmin?: boolean;
  onAdminClick?: () => void;
  // Text size props
  textSize: number;
  minTextSize: number;
  maxTextSize: number;
  onIncreaseTextSize: () => void;
  onDecreaseTextSize: () => void;
  // Help props
  onOpenHelp: () => void;
  // Split view props
  splitViewEnabled?: boolean;
  onToggleSplitView?: () => void;
  // Screen recorder props
  showScreenRecorder?: boolean;
  onToggleScreenRecorder?: () => void;
}

const ChapterHeader: React.FC<ChapterHeaderProps> = ({
  bookId,
  bookName,
  chapterNum,
  totalChapters,
  onChapterSelect,
  onNavigate,
  studyMode,
  onToggleStudyMode,
  showFootnotes,
  onToggleFootnotes,
  personProfileEnabled,
  onTogglePersonProfile,
  youthMode,
  onToggleYouthMode,
  showNotesPanel,
  onToggleNotesPanel,
  onSearch,
  onSearchResultClick,
  onWordSearch,
  voiceSearchQuery,
  onVoiceSearchHandled,
  // HamburgerMenu props
  useProtoSinaitic,
  webcamEnabled,
  webcamFullscreen,
  screenShareEnabled,
  screenShareWithVerses,
  darkMode,
  theme,
  onToggleProtoSinaitic,
  onToggleWebcam,
  onToggleWebcamSettings,
  onToggleWebcamFullscreen,
  onToggleScreenShare,
  onToggleScreenShareWithVerses,
  onToggleDarkMode,
  onSetTheme,
  // History props
  navigationHistory,
  historyIndex,
  onNavigateToHistoryEntry,
  onClearHistory,
  // Bookmarks props
  bookmarks,
  currentVerse,
  onNavigateToBookmark,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateBookmarkLabel,
  // Notes props
  notesCount,
  // Presentation props
  onTogglePresentation,
  onToggleScripturePresentation,
  // Media control props
  onToggleMediaControl,
  // Auth props
  isSignedIn,
  onSignInClick,
  onAdminClick,
  // Text size props
  textSize,
  minTextSize,
  maxTextSize,
  onIncreaseTextSize,
  onDecreaseTextSize,
  // Help props
  onOpenHelp,
  // Split view props
  splitViewEnabled,
  onToggleSplitView,
  // Screen recorder props
  showScreenRecorder,
  onToggleScreenRecorder,
}) => {
  const [isChapterSelectorOpen, setIsChapterSelectorOpen] = useState(false);
  const [isNavigationModalOpen, setIsNavigationModalOpen] = useState(false);
  const { isQuizModeEnabled, toggleQuizMode } = useQuiz();

  const handlePreviousChapter = () => {
    if (chapterNum > 1) {
      onChapterSelect(chapterNum - 1);
    } else {
      // Go to previous book's last chapter
      const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === bookId);
      if (currentBookIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentBookIndex - 1];
        onNavigate(prevBook.id, prevBook.chapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (chapterNum < totalChapters) {
      onChapterSelect(chapterNum + 1);
    } else {
      // Go to next book's first chapter
      const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === bookId);
      if (currentBookIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentBookIndex + 1];
        onNavigate(nextBook.id, 1);
      }
    }
  };

  const canGoPrevious = chapterNum > 1 || bookId > 1;
  const canGoNext = chapterNum < totalChapters || bookId < 66;

  return (
    <div className="chapter-header-fixed">
      {/* Top Row: Features Toggle */}
      <div className="chapter-header-features-row">
        <div className="features-toggle-buttons">
          <button
            className={`feature-toggle-btn ${studyMode ? 'active' : ''}`}
            onClick={onToggleStudyMode}
            data-tooltip="✨ Toggle highlighting and study features"
          >
            <span className="feature-icon">✨</span>
            HIGHLIGHTS
          </button>
          <button
            className={`feature-toggle-btn ${showFootnotes ? 'active' : ''}`}
            onClick={onToggleFootnotes}
            data-tooltip="📜 Toggle 1611 KJV Footnotes"
          >
            <span className="feature-icon">📜</span>
            FOOTNOTES
          </button>
          <button
            className={`feature-toggle-btn ${personProfileEnabled ? 'active' : ''}`}
            onClick={onTogglePersonProfile}
            data-tooltip="👤 Toggle person profiles"
          >
            <span className="feature-icon">👤</span>
            PROFILES
          </button>
          <button
            className={`feature-toggle-btn ${youthMode ? 'active' : ''}`}
            onClick={onToggleYouthMode}
            data-tooltip="🎨 Toggle visual/youth mode"
          >
            <span className="feature-icon">🎨</span>
            VISUALS
          </button>
          <button
            className={`feature-toggle-btn ${showNotesPanel ? 'active' : ''}`}
            onClick={onToggleNotesPanel}
            data-tooltip="📝 Toggle notes panel"
          >
            <span className="feature-icon">📝</span>
            NOTES
          </button>
          <button
            className={`feature-toggle-btn ${isQuizModeEnabled ? 'active' : ''}`}
            onClick={toggleQuizMode}
            data-tooltip="❓ Toggle quiz mode"
          >
            <span className="feature-icon">❓</span>
            QUIZ
          </button>
          {onToggleSplitView && (
            <button
              className={`feature-toggle-btn ${splitViewEnabled ? 'active' : ''}`}
              onClick={onToggleSplitView}
              data-tooltip="⧉ Compare translations side by side"
            >
              <span className="feature-icon">⧉</span>
              COMPARE
            </button>
          )}
        </div>
      </div>

      {/* Left: Hamburger Menu and App Title - vertically centered in header */}
      <div className="chapter-header-left">
        <HamburgerMenu
          useProtoSinaitic={useProtoSinaitic}
          webcamEnabled={webcamEnabled}
          webcamFullscreen={webcamFullscreen}
          screenShareEnabled={screenShareEnabled}
          screenShareWithVerses={screenShareWithVerses}
          youthMode={youthMode}
          studyMode={studyMode}
          darkMode={darkMode}
          theme={theme}
          personProfileEnabled={personProfileEnabled}
          onToggleProtoSinaitic={onToggleProtoSinaitic}
          onToggleWebcam={onToggleWebcam}
          onToggleWebcamSettings={onToggleWebcamSettings}
          onToggleWebcamFullscreen={onToggleWebcamFullscreen}
          onToggleScreenShare={onToggleScreenShare}
          onToggleScreenShareWithVerses={onToggleScreenShareWithVerses}
          onToggleYouthMode={onToggleYouthMode}
          onToggleStudyMode={onToggleStudyMode}
          onToggleDarkMode={onToggleDarkMode}
          onSetTheme={onSetTheme}
          onTogglePersonProfile={onTogglePersonProfile}
          navigationHistory={navigationHistory}
          historyIndex={historyIndex}
          onNavigateToHistoryEntry={onNavigateToHistoryEntry}
          onClearHistory={onClearHistory}
          bookmarks={bookmarks}
          currentBookId={bookId}
          currentChapter={chapterNum}
          currentVerse={currentVerse}
          onNavigateToBookmark={onNavigateToBookmark}
          onAddBookmark={onAddBookmark}
          onRemoveBookmark={onRemoveBookmark}
          onUpdateBookmarkLabel={onUpdateBookmarkLabel}
          showNotesPanel={showNotesPanel}
          notesCount={notesCount}
          onToggleNotesPanel={onToggleNotesPanel}
          onTogglePresentation={onTogglePresentation}
          onToggleScripturePresentation={onToggleScripturePresentation}
          onToggleMediaControl={onToggleMediaControl}
          isSignedIn={isSignedIn}
          onSignInClick={onSignInClick}
          textSize={textSize}
          minTextSize={minTextSize}
          maxTextSize={maxTextSize}
          onIncreaseTextSize={onIncreaseTextSize}
          onDecreaseTextSize={onDecreaseTextSize}
          showFootnotes={showFootnotes}
          onToggleFootnotes={onToggleFootnotes}
          onOpenHelp={onOpenHelp}
          showScreenRecorder={showScreenRecorder}
          onToggleScreenRecorder={onToggleScreenRecorder}
        />
        <span className="app-title">THE BOOK</span>
      </div>

      {/* Bottom Row: Navigation, Search, Translation, Auth */}
      <div className="chapter-header-nav-row">
        {/* Center: Navigation with Expandable Search */}
        <div className="chapter-header-nav">
          {/* Text Size Controls - left of navigation buttons */}
          <div className="chapter-header-text-size">
            <div className="text-size-controls">
              <button
                className="text-size-btn"
                onClick={onDecreaseTextSize}
                disabled={textSize <= minTextSize}
                title="Decrease text size"
                aria-label="Decrease text size"
              >
                A-
              </button>
              <span className="text-size-value">{textSize}px</span>
              <button
                className="text-size-btn"
                onClick={onIncreaseTextSize}
                disabled={textSize >= maxTextSize}
                title="Increase text size"
                aria-label="Increase text size"
              >
                A+
              </button>
            </div>
          </div>

          <button
            className="chapter-nav-btn"
            onClick={handlePreviousChapter}
            disabled={!canGoPrevious}
            title="Previous Chapter"
            aria-label="Previous Chapter"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>

          <div className="chapter-title-container">
            <span
              className="chapter-book-name"
              onClick={() => setIsNavigationModalOpen(true)}
              title="Select book"
            >
              {bookName}
            </span>
            <span
              className="chapter-number"
              onClick={() => setIsChapterSelectorOpen(true)}
              title="Select chapter"
            >
              {chapterNum}
            </span>
          </div>

          <button
            className="chapter-nav-btn"
            onClick={handleNextChapter}
            disabled={!canGoNext}
            title="Next Chapter"
            aria-label="Next Chapter"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>

          {/* Expandable Search Button */}
          <ExpandableSearchBox
            onSearch={onSearch}
            onResultClick={onSearchResultClick}
            onWordSearch={onWordSearch}
            voiceSearchQuery={voiceSearchQuery}
            onVoiceSearchHandled={onVoiceSearchHandled}
          />

          {/* Translation Selector */}
          <TranslationSelector className="nav-compact" />

          {/* Auth Button */}
          <AuthButton
            onLoginClick={onSignInClick}
            onAdminClick={onAdminClick}
          />
        </div>
      </div>

      {/* Chapter Selector Modal */}
      <ChapterSelector
        isOpen={isChapterSelectorOpen}
        onClose={() => setIsChapterSelectorOpen(false)}
        bookName={bookName}
        totalChapters={totalChapters}
        currentChapter={chapterNum}
        onChapterSelect={onChapterSelect}
      />

      {/* Navigation Modal */}
      <NavigationModal
        isOpen={isNavigationModalOpen}
        onClose={() => setIsNavigationModalOpen(false)}
        onNavigate={(navBookId, navChapter) => {
          onNavigate(navBookId, navChapter);
          setIsNavigationModalOpen(false);
        }}
        currentBookId={bookId}
        currentChapter={chapterNum}
      />
    </div>
  );
};

export default ChapterHeader;
