/**
 * VoiceCommandButton Component
 * A floating button that activates voice command listening
 * with visual feedback for listening state and command results
 */

import React, { useState, useEffect, useRef } from 'react';
import { VoiceRecognitionState, VoiceCommandFeedback } from '../types/voiceCommands';
import './VoiceCommandButton.css';

interface VoiceCommandButtonProps {
  state: VoiceRecognitionState;
  isListening: boolean;
  isAlwaysOn: boolean;
  isSupported: boolean;
  onToggle: () => void;
  onToggleAlwaysOn: () => void;
  feedback: VoiceCommandFeedback | null;
  interimTranscript: string;
  suggestions: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  state,
  isListening,
  isAlwaysOn,
  isSupported,
  onToggle,
  onToggleAlwaysOn,
  feedback,
  interimTranscript,
  suggestions,
  onSuggestionClick,
}) => {
  const [showPanel, setShowPanel] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Show panel when listening or has feedback
  useEffect(() => {
    if (isListening || feedback || interimTranscript) {
      setShowPanel(true);
    } else {
      // Hide panel after delay
      const timer = setTimeout(() => setShowPanel(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isListening, feedback, interimTranscript]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        if (!isListening) {
          setShowPanel(false);
          setShowHelp(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isListening]);

  if (!isSupported) {
    return null; // Don't render if voice not supported
  }

  const getStateClass = () => {
    const classes: string[] = [];

    if (isAlwaysOn) {
      classes.push('always-on');
    }

    switch (state) {
      case 'listening':
        classes.push('listening');
        break;
      case 'processing':
        classes.push('processing');
        break;
      case 'error':
        classes.push('error');
        break;
    }

    return classes.join(' ');
  };

  const getFeedbackClass = () => {
    if (!feedback) return '';
    return `feedback-${feedback.type}`;
  };

  const getMicrophoneIcon = () => {
    if (state === 'listening') {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="mic-icon active">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="mic-icon">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    );
  };

  return (
    <div className="voice-command-container" ref={panelRef}>
      {/* Main Button */}
      <button
        className={`voice-command-btn ${getStateClass()}`}
        onClick={onToggle}
        title={isListening ? 'Stop listening' : 'Start voice command'}
        aria-label={isListening ? 'Stop voice command' : 'Start voice command'}
      >
        {getMicrophoneIcon()}
        {isListening && <span className="pulse-ring" />}
        {isListening && <span className="pulse-ring delay" />}
      </button>

      {/* Always-On Toggle Button */}
      <button
        className={`voice-always-on-btn ${isAlwaysOn ? 'active' : ''}`}
        onClick={onToggleAlwaysOn}
        title={isAlwaysOn ? 'Disable always-on listening' : 'Enable always-on listening (requires "Hey Bible" wake word)'}
        aria-label={isAlwaysOn ? 'Disable always-on listening' : 'Enable always-on listening'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
          <circle cx="12" cy="12" r="5"/>
        </svg>
      </button>

      {/* Help Button */}
      <button
        className="voice-help-btn"
        onClick={() => setShowHelp(!showHelp)}
        title="Voice command help"
        aria-label="Voice command help"
      >
        ?
      </button>

      {/* Feedback Panel */}
      {showPanel && (
        <div className={`voice-feedback-panel ${getFeedbackClass()}`}>
          {/* Listening indicator */}
          {isListening && (
            <div className="voice-listening">
              <div className="listening-waves">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="listening-text">Listening...</span>
            </div>
          )}

          {/* Interim transcript */}
          {interimTranscript && (
            <div className="voice-interim">
              <span className="interim-label">Hearing:</span>
              <span className="interim-text">{interimTranscript}</span>
            </div>
          )}

          {/* Feedback message */}
          {feedback && (
            <div className={`voice-feedback-message ${feedback.type}`}>
              {feedback.type === 'success' && <span className="feedback-icon">✓</span>}
              {feedback.type === 'error' && <span className="feedback-icon">✗</span>}
              {feedback.type === 'info' && <span className="feedback-icon">ℹ</span>}
              <span className="feedback-text">{feedback.message}</span>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="voice-suggestions">
              <span className="suggestions-label">Did you mean:</span>
              <div className="suggestions-list">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="suggestion-item"
                    onClick={() => onSuggestionClick?.(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div className="voice-help-panel">
          <div className="help-header">
            <h3>Voice Commands</h3>
            <button className="help-close" onClick={() => setShowHelp(false)}>×</button>
          </div>
          <div className="help-content">
            <div className="help-section">
              <h4>Navigation</h4>
              <ul>
                <li>"Go to John 3:16"</li>
                <li>"Read Genesis chapter 1"</li>
                <li>"Next chapter"</li>
                <li>"Previous chapter"</li>
                <li>"Verse 5"</li>
                <li>"Go back"</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>Mode Controls</h4>
              <ul>
                <li>"Open webcam" / "Close webcam"</li>
                <li>"Enable dark mode"</li>
                <li>"Enable study mode"</li>
                <li>"Enable youth mode"</li>
                <li>"Fullscreen"</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>Study Tools</h4>
              <ul>
                <li>"Look up Strong's H1234"</li>
                <li>"Search for love"</li>
                <li>"Add bookmark"</li>
                <li>"Create note"</li>
                <li>"Show footnotes"</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>Reading (Text-to-Speech)</h4>
              <ul>
                <li>"Read this chapter"</li>
                <li>"Read verse 1 to 10"</li>
                <li>"Read the whole book"</li>
                <li>"Stop reading"</li>
                <li>"Repeat 3 times"</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>Person Profiles</h4>
              <ul>
                <li>"Who is Adam"</li>
                <li>"Show profile of Moses"</li>
                <li>"Tell me about David"</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>Text Size</h4>
              <ul>
                <li>"Increase text size"</li>
                <li>"Decrease text size"</li>
                <li>"Set text size to 24"</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommandButton;
