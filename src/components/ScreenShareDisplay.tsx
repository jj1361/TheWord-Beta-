import React, { useRef, useEffect, useState } from 'react';
import './ScreenShareDisplay.css';

interface ScreenShareDisplayProps {
  isVisible: boolean;
  isFullscreen?: boolean;
  onShareStopped?: () => void;
}

const ScreenShareDisplay: React.FC<ScreenShareDisplayProps> = ({ isVisible, isFullscreen = false, onShareStopped }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isStartingRef = useRef(false);

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsSharing(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScreenShare = async () => {
    // Prevent multiple simultaneous start attempts
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      setError(null);

      // Request screen sharing with audio
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true // Include system audio if available
      });

      // Handle when user stops sharing via browser controls
      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
        // Notify parent that sharing has stopped
        if (onShareStopped) {
          onShareStopped();
        }
      });

      streamRef.current = mediaStream;
      setIsSharing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing screen share:', err);
      // User cancelled or error occurred - notify parent to toggle off
      if (onShareStopped) {
        onShareStopped();
      }
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          // User cancelled - don't show error, just close
          isStartingRef.current = false;
          return;
        } else if (err.name === 'NotFoundError') {
          setError('No screen available to share.');
        } else {
          setError('Failed to start screen sharing. Please try again.');
        }
      }
    }
    isStartingRef.current = false;
  };

  useEffect(() => {
    if (isVisible && !streamRef.current && !isStartingRef.current) {
      startScreenShare();
    }

    return () => {
      stopScreenShare();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const handleRestartShare = () => {
    stopScreenShare();
    setTimeout(() => startScreenShare(), 100);
  };

  if (!isVisible) return null;

  return (
    <div className={`screen-share-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="screen-share-header">
        <h3>📺 Screen Share</h3>
        {isSharing && (
          <div className="screen-share-controls">
            <button
              className="screen-share-btn restart"
              onClick={handleRestartShare}
              title="Restart screen sharing"
            >
              🔄 Restart
            </button>
            <span className="sharing-indicator">
              <span className="pulse-dot"></span>
              Sharing
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="screen-share-error">
          <p>{error}</p>
          <button onClick={startScreenShare} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {!error && (
        <div className="screen-share-video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            className="screen-share-video"
          />
          {!isSharing && (
            <div className="screen-share-placeholder">
              <div className="placeholder-content">
                <span className="placeholder-icon">📺</span>
                <p>Starting screen share...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {isFullscreen && (
        <div className="screen-share-footer">
          <small>Press ESC or click the sidebar button to exit fullscreen</small>
        </div>
      )}
    </div>
  );
};

export default ScreenShareDisplay;
