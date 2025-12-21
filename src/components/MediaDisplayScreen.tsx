import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaState, Announcement } from '../types/media';
import { mediaService } from '../services/mediaService';
import './MediaDisplayScreen.css';

interface MediaDisplayScreenProps {
  onClose: () => void;
}

const MediaDisplayScreen: React.FC<MediaDisplayScreenProps> = ({ onClose }) => {
  const [state, setState] = useState<MediaState>(mediaService.getState());
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [announcementFading, setAnnouncementFading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  // Audio is handled by MediaControlPanel - this component only displays info
  const youtubeRef = useRef<HTMLIFrameElement>(null);
  const announcementTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPendingPlayRef = useRef<boolean>(false);

  // Subscribe to media state changes
  useEffect(() => {
    const unsubscribe = mediaService.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  // Handle video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !state.videoSource) return;

    if (state.videoPlaying) {
      // Check if video is ready to play
      if (video.readyState >= 2) {
        video.play().catch((err) => {
          console.error('Video play error:', err);
        });
      } else {
        // Video not ready - set pending flag
        videoPendingPlayRef.current = true;
      }
    } else {
      video.pause();
      videoPendingPlayRef.current = false;
    }
  }, [state.videoPlaying, state.videoSource, state.activeMode]);

  // Handle video can play event
  const handleVideoCanPlay = () => {
    if (videoRef.current && (videoPendingPlayRef.current || state.videoPlaying)) {
      videoPendingPlayRef.current = false;
      videoRef.current.play().catch((err) => {
        console.error('Video play error on canplay:', err);
      });
    }
  };

  // Handle video volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = state.videoVolume;
      videoRef.current.muted = state.videoMuted;
    }
  }, [state.videoVolume, state.videoMuted]);

  // Audio playback is handled by MediaControlPanel to avoid duplicate audio
  // This component only displays the "Now Playing" UI

  // Handle announcement rotation
  const rotateAnnouncement = useCallback(() => {
    const enabledAnnouncements = state.announcements.filter((a) => a.enabled);
    if (enabledAnnouncements.length === 0) {
      setCurrentAnnouncement(null);
      return;
    }

    setAnnouncementFading(true);
    setTimeout(() => {
      mediaService.nextAnnouncement();
      const newState = mediaService.getState();
      const newAnnouncement = enabledAnnouncements[newState.currentAnnouncementIndex % enabledAnnouncements.length];
      setCurrentAnnouncement(newAnnouncement || null);
      setAnnouncementFading(false);
    }, 300);
  }, [state.announcements]);

  useEffect(() => {
    if (state.announcementsEnabled) {
      const enabledAnnouncements = state.announcements.filter((a) => a.enabled);
      if (enabledAnnouncements.length > 0) {
        setCurrentAnnouncement(enabledAnnouncements[state.currentAnnouncementIndex % enabledAnnouncements.length]);

        if (enabledAnnouncements.length > 1) {
          announcementTimerRef.current = setInterval(rotateAnnouncement, state.rotationInterval * 1000);
        }
      }
    } else {
      setCurrentAnnouncement(null);
    }

    return () => {
      if (announcementTimerRef.current) {
        clearInterval(announcementTimerRef.current);
      }
    };
  }, [state.announcementsEnabled, state.announcements, state.rotationInterval, state.currentAnnouncementIndex, rotateAnnouncement]);

  // Handle video end
  const handleVideoEnded = () => {
    mediaService.setVideoPlaying(false);
  };

  // Get current audio track
  const currentTrack = state.audioPlaylist[state.currentTrackIndex];

  // Get current background
  const currentBackground = state.activeBackgroundIndex >= 0 && state.backgrounds[state.activeBackgroundIndex]
    ? state.backgrounds[state.activeBackgroundIndex]
    : null;

  // Get YouTube embed URL
  const getYoutubeEmbedUrl = () => {
    const track = state.youtubeTracks[state.youtubeCurrentIndex];
    if (!track) return null;
    const autoplay = state.youtubePlaying ? 1 : 0;
    return `https://www.youtube.com/embed/${track.videoId}?autoplay=${autoplay}&enablejsapi=1`;
  };

  // Get presentation embed URL
  const getPresentationUrl = () => {
    if (!state.presentation) return null;

    if (state.presentation.type === 'gslides') {
      return mediaService.convertGoogleSlidesUrl(state.presentation.src);
    }

    if (state.presentation.type === 'pdf') {
      // Use Google Docs viewer for PDFs
      return `https://docs.google.com/viewer?url=${encodeURIComponent(state.presentation.src)}&embedded=true`;
    }

    return state.presentation.src;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (state.activeMode === 'video') {
          mediaService.setVideoPlaying(!state.videoPlaying);
        } else if (currentTrack) {
          mediaService.setAudioPlaying(!state.audioPlaying);
        }
      } else if (e.key === 'ArrowRight') {
        if (state.activeMode === 'presentation') {
          mediaService.nextSlide();
        } else if (currentTrack) {
          mediaService.nextTrack();
        }
      } else if (e.key === 'ArrowLeft') {
        if (state.activeMode === 'presentation') {
          mediaService.previousSlide();
        } else if (currentTrack) {
          mediaService.previousTrack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, state.activeMode, state.videoPlaying, state.audioPlaying, currentTrack]);

  return (
    <div className="media-display-screen">
      {/* Background Layer */}
      <div
        className="media-display-background"
        style={{
          backgroundColor: currentBackground?.type === 'color' ? currentBackground.value : '#000',
          backgroundImage: currentBackground?.type === 'image' ? `url(${currentBackground.value})` : 'none',
        }}
      />

      {/* Video Layer */}
      {state.activeMode === 'video' && state.videoSource && (
        <div className="media-display-video">
          <video
            ref={videoRef}
            src={state.videoSource.src}
            className="media-video-player"
            onEnded={handleVideoEnded}
            onCanPlay={handleVideoCanPlay}
            preload="auto"
          />
        </div>
      )}

      {/* YouTube Layer */}
      {state.activeMode === 'youtube' && state.youtubeTracks.length > 0 && (
        <div className={`media-display-youtube ${state.youtubeAudioOnly ? 'audio-only' : ''}`}>
          <iframe
            ref={youtubeRef}
            src={getYoutubeEmbedUrl() || ''}
            title="YouTube Player"
            className="media-youtube-player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {state.youtubeAudioOnly && (
            <div className="youtube-audio-overlay">
              <div className="youtube-audio-info">
                <span className="youtube-audio-icon">🎵</span>
                <span className="youtube-audio-title">
                  {state.youtubeTracks[state.youtubeCurrentIndex]?.title || 'Playing Audio'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Presentation Layer */}
      {state.activeMode === 'presentation' && state.presentation && (
        <div className="media-display-presentation">
          <iframe
            src={getPresentationUrl() || ''}
            title="Presentation"
            className="media-presentation-viewer"
            allowFullScreen
          />
        </div>
      )}

      {/* Audio is played by MediaControlPanel - no audio element here to avoid duplicates */}

      {/* Announcements Banner */}
      {state.announcementsEnabled && currentAnnouncement && (
        <div className={`media-announcements-banner ${announcementFading ? 'fading' : ''}`}>
          <div className="announcement-text">
            {currentAnnouncement.text}
          </div>
        </div>
      )}

      {/* Now Playing Bar (for audio) */}
      {currentTrack && state.audioPlaying && (
        <div className="media-now-playing">
          <div className="now-playing-info">
            <span className="now-playing-icon">🎵</span>
            <span className="now-playing-title">{currentTrack.name}</span>
          </div>
          <div className="now-playing-controls">
            <button onClick={() => mediaService.previousTrack()} title="Previous">⏮</button>
            <button onClick={() => mediaService.setAudioPlaying(!state.audioPlaying)} title={state.audioPlaying ? 'Pause' : 'Play'}>
              {state.audioPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={() => mediaService.nextTrack()} title="Next">⏭</button>
          </div>
        </div>
      )}

      {/* Close Button */}
      <button className="media-display-close" onClick={onClose} title="Close (Esc)">
        ×
      </button>

      {/* Controls Hint */}
      <div className="media-controls-hint">
        Press ESC to close • Space to play/pause • Arrows to navigate
      </div>
    </div>
  );
};

export default MediaDisplayScreen;
