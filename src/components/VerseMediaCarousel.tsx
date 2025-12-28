/**
 * VerseMediaCarousel Component
 *
 * A carousel component for displaying images and videos associated with verses.
 * Supports local images/videos, YouTube, and Vimeo embeds.
 */

import React, { useState, useCallback } from 'react';
import {
  MediaItem,
  getVideoEmbedUrl,
  extractYouTubeId,
  getYouTubeThumbnail,
} from '../config/verseMediaConfig';
import './VerseMediaCarousel.css';

interface VerseMediaCarouselProps {
  media: MediaItem[];
  onClose: () => void;
}

const VerseMediaCarousel: React.FC<VerseMediaCarouselProps> = ({ media, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const currentItem = media[currentIndex];
  const hasMultipleItems = media.length > 1;

  const goToPrevious = useCallback(() => {
    setIsVideoPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  }, [media.length]);

  const goToNext = useCallback(() => {
    setIsVideoPlaying(false);
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  }, [media.length]);

  const goToSlide = useCallback((index: number) => {
    setIsVideoPlaying(false);
    setCurrentIndex(index);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [goToPrevious, goToNext, onClose]
  );

  const renderMediaContent = () => {
    if (!currentItem) return null;

    if (currentItem.type === 'image') {
      return (
        <div className="carousel-image-container">
          <img
            src={currentItem.src}
            alt={currentItem.title || 'Verse media'}
            className="carousel-image"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/media/placeholder-image.svg';
              target.onerror = null;
            }}
          />
        </div>
      );
    }

    if (currentItem.type === 'video') {
      const embedUrl = getVideoEmbedUrl(currentItem);

      // For YouTube/Vimeo, show thumbnail until played
      if (
        (currentItem.videoSource === 'youtube' || currentItem.videoSource === 'vimeo') &&
        !isVideoPlaying
      ) {
        let thumbnailUrl = currentItem.thumbnail;

        // Auto-generate YouTube thumbnail if not provided
        if (!thumbnailUrl && currentItem.videoSource === 'youtube') {
          const videoId = extractYouTubeId(currentItem.src);
          if (videoId) {
            thumbnailUrl = getYouTubeThumbnail(videoId);
          }
        }

        return (
          <div className="carousel-video-thumbnail" onClick={() => setIsVideoPlaying(true)}>
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt={currentItem.title || 'Video thumbnail'}
                className="carousel-thumbnail-image"
              />
            )}
            <div className="carousel-play-overlay">
              <div className="carousel-play-button">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="carousel-play-text">Click to play</span>
            </div>
          </div>
        );
      }

      // Show iframe for YouTube/Vimeo
      if (currentItem.videoSource === 'youtube' || currentItem.videoSource === 'vimeo') {
        return (
          <div className="carousel-video-container">
            <iframe
              src={embedUrl + (currentItem.videoSource === 'youtube' ? '&autoplay=1' : '?autoplay=1')}
              title={currentItem.title || 'Video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="carousel-video-iframe"
            />
          </div>
        );
      }

      // Local video
      return (
        <div className="carousel-video-container">
          <video
            src={currentItem.src}
            controls
            autoPlay={isVideoPlaying}
            className="carousel-video"
            poster={currentItem.thumbnail}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return null;
  };

  if (!media || media.length === 0) {
    return null;
  }

  return (
    <div
      className="verse-media-carousel"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Verse media carousel"
    >
      {/* Close button */}
      <button className="carousel-close-btn" onClick={onClose} aria-label="Close carousel">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>

      {/* Main content area */}
      <div className="carousel-content">
        {/* Previous button */}
        {hasMultipleItems && (
          <button
            className="carousel-nav-btn carousel-nav-prev"
            onClick={goToPrevious}
            aria-label="Previous media"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
        )}

        {/* Media display */}
        <div className="carousel-media-wrapper">
          {renderMediaContent()}

          {/* Caption */}
          {(currentItem?.title || currentItem?.description) && (
            <div className="carousel-caption">
              {currentItem.title && <h4 className="carousel-caption-title">{currentItem.title}</h4>}
              {currentItem.description && (
                <p className="carousel-caption-description">{currentItem.description}</p>
              )}
              {currentItem.attribution && (
                <span className="carousel-caption-attribution">{currentItem.attribution}</span>
              )}
            </div>
          )}
        </div>

        {/* Next button */}
        {hasMultipleItems && (
          <button
            className="carousel-nav-btn carousel-nav-next"
            onClick={goToNext}
            aria-label="Next media"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        )}
      </div>

      {/* Dots indicator */}
      {hasMultipleItems && (
        <div className="carousel-dots">
          {media.map((item, index) => (
            <button
              key={item.id}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              {item.type === 'video' ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="dot-icon">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <span className="dot-circle" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      {hasMultipleItems && (
        <div className="carousel-counter">
          {currentIndex + 1} / {media.length}
        </div>
      )}
    </div>
  );
};

export default VerseMediaCarousel;
