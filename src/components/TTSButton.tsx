/**
 * TTSButton Component
 * A floating button for Text-to-Speech controls
 * Shows play/pause/stop controls when reading
 */

import React, { useState } from 'react';
import './TTSButton.css';

interface TTSButtonProps {
  isSupported: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentVerse: number | null;
  currentRepeat: number;
  totalRepeats: number;
  progress: {
    currentVerse: number;
    totalVerses: number;
    currentBook?: string;
    currentChapter?: number;
  } | null;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  onShowSettings?: () => void;
}

const TTSButton: React.FC<TTSButtonProps> = ({
  isSupported,
  isPlaying,
  isPaused,
  currentVerse,
  currentRepeat,
  totalRepeats,
  progress,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSkipNext,
  onSkipPrevious,
  onShowSettings,
}) => {
  const [showControls, setShowControls] = useState(false);

  if (!isSupported) {
    return null;
  }

  const handleMainButtonClick = () => {
    if (isPlaying && !isPaused) {
      onPause();
    } else if (isPaused) {
      onResume();
    } else {
      // Show controls panel to start reading
      setShowControls(true);
    }
  };

  const getMainIcon = () => {
    if (isPlaying && !isPaused) {
      // Pause icon
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="tts-icon">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      );
    } else if (isPaused) {
      // Play icon
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="tts-icon">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    } else {
      // Speaker icon
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="tts-icon">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      );
    }
  };

  return (
    <div className="tts-container">
      {/* Progress Panel - Shows when playing */}
      {(isPlaying || isPaused) && progress && (
        <div className="tts-progress-panel">
          <div className="tts-progress-header">
            <span className="tts-progress-title">
              {progress.currentBook && progress.currentChapter
                ? `${progress.currentBook} ${progress.currentChapter}`
                : 'Reading'}
            </span>
            {totalRepeats > 1 && (
              <span className="tts-repeat-indicator">
                Repeat {currentRepeat}/{totalRepeats}
              </span>
            )}
          </div>

          <div className="tts-progress-info">
            <span className="tts-current-verse">Verse {currentVerse}</span>
            <span className="tts-verse-count">
              {progress.currentVerse} of {progress.totalVerses}
            </span>
          </div>

          <div className="tts-progress-bar">
            <div
              className="tts-progress-fill"
              style={{
                width: `${(progress.currentVerse / progress.totalVerses) * 100}%`,
              }}
            />
          </div>

          <div className="tts-controls">
            <button
              className="tts-control-btn"
              onClick={onSkipPrevious}
              title="Previous verse"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              className="tts-control-btn primary"
              onClick={isPaused ? onResume : onPause}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>

            <button
              className="tts-control-btn"
              onClick={onSkipNext}
              title="Next verse"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            <button
              className="tts-control-btn stop"
              onClick={onStop}
              title="Stop"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Panel - Shows on hover when not playing */}
      {showControls && !isPlaying && !isPaused && (
        <div className="tts-quick-panel">
          <div className="tts-quick-header">
            <span>Read Aloud</span>
            <button
              className="tts-close-btn"
              onClick={() => setShowControls(false)}
            >
              ×
            </button>
          </div>
          <div className="tts-quick-actions">
            <button className="tts-quick-action" onClick={onPlay}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Read Chapter
            </button>
            {onShowSettings && (
              <button
                className="tts-quick-action secondary"
                onClick={onShowSettings}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                Settings
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        className={`tts-main-btn ${isPlaying ? 'playing' : ''} ${isPaused ? 'paused' : ''}`}
        onClick={handleMainButtonClick}
        title={
          isPlaying && !isPaused
            ? 'Pause reading'
            : isPaused
            ? 'Resume reading'
            : 'Read aloud'
        }
      >
        {getMainIcon()}
        {isPlaying && !isPaused && <span className="tts-pulse-ring" />}
      </button>
    </div>
  );
};

export default TTSButton;
