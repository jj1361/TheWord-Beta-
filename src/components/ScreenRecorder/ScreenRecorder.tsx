/**
 * ScreenRecorder Component
 *
 * A floating UI component for recording screen and audio.
 * Provides controls for start/stop, pause/resume, and audio source selection.
 */

import React, { useState, useCallback } from 'react';
import useScreenRecorder, { RecordingOptions } from '../../hooks/useScreenRecorder';
import './ScreenRecorder.css';

interface ScreenRecorderProps {
  onClose?: () => void;
  defaultOptions?: Partial<RecordingOptions>;
}

const ScreenRecorder: React.FC<ScreenRecorderProps> = ({
  onClose,
  defaultOptions = {},
}) => {
  const {
    isRecording,
    isPaused,
    duration,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    saveRecording,
    formatDuration,
  } = useScreenRecorder();

  const [showSettings, setShowSettings] = useState(!isRecording);
  const [captureSystemAudio, setCaptureSystemAudio] = useState(
    defaultOptions.captureSystemAudio ?? true
  );
  const [captureMicrophone, setCaptureMicrophone] = useState(
    defaultOptions.captureMicrophone ?? false
  );
  const [isMinimized, setIsMinimized] = useState(false);

  const handleStartRecording = useCallback(async () => {
    await startRecording({
      captureScreen: true,
      captureSystemAudio,
      captureMicrophone,
    });
    setShowSettings(false);
  }, [startRecording, captureSystemAudio, captureMicrophone]);

  const handleStopRecording = useCallback(async () => {
    const blob = await stopRecording();
    if (blob) {
      saveRecording(blob);
    }
    setShowSettings(true);
  }, [stopRecording, saveRecording]);

  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  }, [isPaused, pauseRecording, resumeRecording]);

  if (!isSupported) {
    return (
      <div className="screen-recorder screen-recorder-error">
        <div className="screen-recorder-header">
          <span className="screen-recorder-title">Screen Recording</span>
          {onClose && (
            <button className="screen-recorder-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
        <p className="screen-recorder-not-supported">
          Screen recording is not supported in this browser.
        </p>
      </div>
    );
  }

  if (isMinimized && isRecording) {
    return (
      <div
        className={`screen-recorder-minimized ${isPaused ? 'paused' : ''}`}
        onClick={() => setIsMinimized(false)}
        title="Click to expand"
      >
        <span className="recording-indicator" />
        <span className="recording-duration">{formatDuration(duration)}</span>
      </div>
    );
  }

  return (
    <div className={`screen-recorder ${isRecording ? 'recording' : ''}`}>
      {/* Header */}
      <div className="screen-recorder-header">
        <span className="screen-recorder-title">
          {isRecording && <span className="recording-indicator" />}
          {isRecording ? 'Recording' : 'Screen Recorder'}
        </span>
        <div className="screen-recorder-header-actions">
          {isRecording && (
            <button
              className="screen-recorder-minimize"
              onClick={() => setIsMinimized(true)}
              title="Minimize"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13H5v-2h14v2z" />
              </svg>
            </button>
          )}
          {onClose && !isRecording && (
            <button className="screen-recorder-close" onClick={onClose} title="Close">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="screen-recorder-error-message">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Settings (shown when not recording) */}
      {showSettings && !isRecording && (
        <div className="screen-recorder-settings">
          <label className="screen-recorder-option">
            <input
              type="checkbox"
              checked={captureSystemAudio}
              onChange={(e) => setCaptureSystemAudio(e.target.checked)}
            />
            <span className="option-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </span>
            <span className="option-label">System Audio</span>
            <span className="option-hint">(Tab audio when sharing a tab)</span>
          </label>

          <label className="screen-recorder-option">
            <input
              type="checkbox"
              checked={captureMicrophone}
              onChange={(e) => setCaptureMicrophone(e.target.checked)}
            />
            <span className="option-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            </span>
            <span className="option-label">Microphone</span>
            <span className="option-hint">(For voice narration)</span>
          </label>
        </div>
      )}

      {/* Recording status */}
      {isRecording && (
        <div className="screen-recorder-status">
          <div className="recording-timer">
            <span className={`timer-display ${isPaused ? 'paused' : ''}`}>
              {formatDuration(duration)}
            </span>
            {isPaused && <span className="paused-label">PAUSED</span>}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="screen-recorder-controls">
        {!isRecording ? (
          <button
            className="recorder-btn recorder-btn-start"
            onClick={handleStartRecording}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="8" />
            </svg>
            <span>Start Recording</span>
          </button>
        ) : (
          <>
            <button
              className={`recorder-btn recorder-btn-pause ${isPaused ? 'paused' : ''}`}
              onClick={handleTogglePause}
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
              className="recorder-btn recorder-btn-stop"
              onClick={handleStopRecording}
              title="Stop and Save"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              <span>Stop & Save</span>
            </button>
          </>
        )}
      </div>

      {/* Help text */}
      {!isRecording && (
        <p className="screen-recorder-help">
          Click "Start Recording" to capture your screen. You'll be prompted to select what to share.
        </p>
      )}
    </div>
  );
};

export default ScreenRecorder;
