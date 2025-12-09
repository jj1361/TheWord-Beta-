import React, { useRef, useEffect } from 'react';
import { WordImageMapping, getDisplayImagePath, getImagePath } from '../config/youthModeConfig';
import './YouthImagePanel.css';

interface YouthImagePanelProps {
  selectedWord: WordImageMapping | null;
  onClose: () => void;
}

const YouthImagePanel: React.FC<YouthImagePanelProps> = ({ selectedWord, onClose }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax effect on mouse move
  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;

    if (!container || !image) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Subtle parallax movement based on mouse position
      const moveX = (x - 0.5) * 10;
      const moveY = (y - 0.5) * 10;

      image.style.transform = `translateX(${moveX}px) translateY(${moveY}px) scale(1.02)`;
    };

    const handleMouseLeave = () => {
      image.style.transform = 'scale(1)';
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [selectedWord]);

  if (!selectedWord) {
    return null;
  }

  const displayImageSrc = selectedWord.displayImage
    ? getDisplayImagePath(selectedWord.displayImage)
    : getImagePath(selectedWord.image);

  return (
    <div className="youth-image-panel">
      <div className="youth-panel-header">
        <h2 className="youth-panel-title">{selectedWord.alt}</h2>
        <button className="youth-panel-close" onClick={onClose} title="Close">
          &times;
        </button>
      </div>

      <div className="youth-panel-content" ref={containerRef}>
        <div className="youth-display-image-container">
          <img
            ref={imageRef}
            src={displayImageSrc}
            alt={selectedWord.alt}
            className="youth-display-image"
            onError={(e) => {
              // Fallback to inline image if display image fails
              const target = e.target as HTMLImageElement;
              if (selectedWord.displayImage) {
                target.src = getImagePath(selectedWord.image);
              }
            }}
          />
        </div>

        {(selectedWord.tooltip || selectedWord.description) && (
          <div className="youth-text-overlay">
            {selectedWord.tooltip && (
              <div className="youth-panel-tooltip">
                {selectedWord.tooltip}
              </div>
            )}

            {selectedWord.description && (
              <div className="youth-panel-description">
                {selectedWord.description}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouthImagePanel;
