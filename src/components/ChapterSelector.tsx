import React from 'react';
import './ChapterSelector.css';

interface ChapterSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  bookName: string;
  totalChapters: number;
  currentChapter: number;
  onChapterSelect: (chapter: number) => void;
}

const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  isOpen,
  onClose,
  bookName,
  totalChapters,
  currentChapter,
  onChapterSelect,
}) => {
  if (!isOpen) return null;

  const handleChapterClick = (chapter: number) => {
    onChapterSelect(chapter);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="chapter-selector-overlay" onClick={handleBackdropClick}>
      <div className="chapter-selector-modal">
        <div className="chapter-selector-header">
          <h2>{bookName}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="chapter-grid">
          {Array.from({ length: totalChapters }, (_, i) => i + 1).map((chapter) => (
            <button
              key={chapter}
              className={`chapter-btn ${chapter === currentChapter ? 'active' : ''}`}
              onClick={() => handleChapterClick(chapter)}
            >
              {chapter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChapterSelector;
