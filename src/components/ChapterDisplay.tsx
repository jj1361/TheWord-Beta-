import React, { useState } from 'react';
import { Chapter } from '../types/bible';
import VerseDisplay from './VerseDisplay';
import ChapterSelector from './ChapterSelector';
import NavigationModal from './NavigationModal';
import SearchBox from './SearchBox';
import { SearchResponse } from '../services/searchService';
import { WordImageMapping } from '../config/youthModeConfig';
import { HighlightColor, TextFormatting } from '../types/notes';
import './ChapterDisplay.css';

// Text size constants
const MIN_TEXT_SIZE = 12;
const MAX_TEXT_SIZE = 50;
const DEFAULT_TEXT_SIZE = 18;
const TEXT_SIZE_STEP = 2;

interface ChapterDisplayProps {
  chapter: Chapter | null;
  loading: boolean;
  highlightVerse?: number;
  selectedVerse?: number;
  navigatedVerse?: number;
  onLetterClick?: (letter: string) => void;
  onStrongsClick?: (strongs: string) => void;
  onPersonClick?: (personID: string) => void;
  onVerseClick?: (verseNum: number) => void;
  onYouthImageClick?: (wordMapping: WordImageMapping) => void;
  onVerseRightClick?: (verseNum: number, event: React.MouseEvent) => void;
  getVerseHighlightColor?: (verseNum: number) => HighlightColor | undefined;
  getVerseTextFormatting?: (verseNum: number) => TextFormatting[];
  useProtoSinaitic?: boolean;
  youthMode?: boolean;
  studyMode?: boolean;
  totalChapters?: number;
  onChapterSelect?: (chapter: number) => void;
  // Screen share mode props
  screenShareMode?: boolean;
  currentBookId?: number;
  onNavigate?: (bookId: number, chapter: number) => void;
  onSearch?: (query: string) => Promise<SearchResponse>;
  onSearchResultClick?: (bookId: number, chapter: number, verse: number) => void;
  onWordSearch?: (strongsId: string) => void;
}

const ChapterDisplay: React.FC<ChapterDisplayProps> = ({
  chapter,
  loading,
  highlightVerse,
  selectedVerse,
  navigatedVerse,
  onLetterClick,
  onStrongsClick,
  onPersonClick,
  onVerseClick,
  onYouthImageClick,
  onVerseRightClick,
  getVerseHighlightColor,
  getVerseTextFormatting,
  useProtoSinaitic,
  youthMode,
  studyMode,
  totalChapters,
  onChapterSelect,
  screenShareMode,
  currentBookId,
  onNavigate,
  onSearch,
  onSearchResultClick,
  onWordSearch,
}) => {
  const [isChapterSelectorOpen, setIsChapterSelectorOpen] = useState(false);
  const [isNavigationModalOpen, setIsNavigationModalOpen] = useState(false);

  // Text size state - persisted in localStorage
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem('verseTextSize');
    return saved ? parseInt(saved, 10) : DEFAULT_TEXT_SIZE;
  });

  const handleIncreaseTextSize = () => {
    setTextSize(prev => {
      const newSize = Math.min(prev + TEXT_SIZE_STEP, MAX_TEXT_SIZE);
      localStorage.setItem('verseTextSize', newSize.toString());
      return newSize;
    });
  };

  const handleDecreaseTextSize = () => {
    setTextSize(prev => {
      const newSize = Math.max(prev - TEXT_SIZE_STEP, MIN_TEXT_SIZE);
      localStorage.setItem('verseTextSize', newSize.toString());
      return newSize;
    });
  };
  if (loading) {
    return (
      <div className="chapter-display">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="chapter-display">
        <div className="empty-state">
          <h2>Welcome to the Bible App</h2>
          <p>Select a book and chapter to begin reading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chapter-display">
      <div className="chapter-header">
        <h1 className="chapter-title">
          {screenShareMode ? (
            <span
              className="book-name-link"
              onClick={() => setIsNavigationModalOpen(true)}
              title="Select book and chapter"
            >
              {chapter.bookName}
            </span>
          ) : (
            chapter.bookName
          )}{' '}
          <span
            className="chapter-number-link"
            onClick={() => setIsChapterSelectorOpen(true)}
            title="Select chapter"
          >
            {chapter.chapterNum}
          </span>
        </h1>
        <div className="chapter-header-right">
          {/* Text Size Controls */}
          <div className="text-size-controls">
            <button
              className="text-size-btn"
              onClick={handleDecreaseTextSize}
              disabled={textSize <= MIN_TEXT_SIZE}
              title="Decrease text size"
            >
              A-
            </button>
            <span className="text-size-value">{textSize}px</span>
            <button
              className="text-size-btn"
              onClick={handleIncreaseTextSize}
              disabled={textSize >= MAX_TEXT_SIZE}
              title="Increase text size"
            >
              A+
            </button>
          </div>

          {screenShareMode && onSearch && onSearchResultClick ? (
            <div className="chapter-search-container">
              <SearchBox
                onSearch={onSearch}
                onResultClick={onSearchResultClick}
                onWordSearch={onWordSearch}
              />
            </div>
          ) : (
            chapter.interlinearVerses && (
              <div className="chapter-info">
               
              </div>
            )
          )}
        </div>
      </div>

      {totalChapters && onChapterSelect && (
        <ChapterSelector
          isOpen={isChapterSelectorOpen}
          onClose={() => setIsChapterSelectorOpen(false)}
          bookName={chapter.bookName}
          totalChapters={totalChapters}
          currentChapter={chapter.chapterNum}
          onChapterSelect={onChapterSelect}
        />
      )}

      {screenShareMode && onNavigate && currentBookId !== undefined && (
        <NavigationModal
          isOpen={isNavigationModalOpen}
          onClose={() => setIsNavigationModalOpen(false)}
          onNavigate={(bookId, chapterNum) => {
            onNavigate(bookId, chapterNum);
            setIsNavigationModalOpen(false);
          }}
          currentBookId={currentBookId}
          currentChapter={chapter.chapterNum}
        />
      )}

      <div className="verses-container" style={{ '--verse-text-size': `${textSize}px` } as React.CSSProperties}>
        {chapter.kjvVerses.map((verse) => {
          const kjvsVerse = chapter.kjvsVerses?.find(
            (kv) => kv.num === verse.num
          );
          const interlinearVerse = chapter.interlinearVerses?.find(
            (iv) => iv.num === verse.num
          );

          const isHighlighted = highlightVerse === verse.num || navigatedVerse === verse.num;
          // Only show highlights and formatting when study mode is enabled
          const userHighlightColor = studyMode ? getVerseHighlightColor?.(verse.num) : undefined;
          const verseTextFormatting = studyMode ? (getVerseTextFormatting?.(verse.num) || []) : [];

          return (
            <div
              key={verse.num}
              id={`verse-${verse.num}`}
              className={isHighlighted ? 'highlight-verse' : ''}
              onContextMenu={(e) => onVerseRightClick?.(verse.num, e)}
            >
              <VerseDisplay
                verse={verse}
                kjvsVerse={kjvsVerse}
                interlinearVerse={interlinearVerse}
                onLetterClick={onLetterClick}
                onStrongsClick={onStrongsClick}
                onPersonClick={onPersonClick}
                onYouthImageClick={onYouthImageClick}
                isSelected={selectedVerse === verse.num}
                onVerseClick={onVerseClick}
                globalUseProtoSinaitic={useProtoSinaitic}
                youthMode={youthMode}
                highlightColor={userHighlightColor}
                textFormatting={verseTextFormatting}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChapterDisplay;
