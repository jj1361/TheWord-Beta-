import React, { useState } from 'react';
import { Chapter, FootnoteEntry } from '../types/bible';
import VerseDisplay from './VerseDisplay';
import ChapterSelector from './ChapterSelector';
import NavigationModal from './NavigationModal';
import SearchBox from './SearchBox';
import { SearchResponse } from '../services/searchService';
import { WordImageMapping } from '../config/youthModeConfig';
import { HighlightColor, TextFormatting } from '../types/notes';
import './ChapterDisplay.css';

// Default text size if not provided
const DEFAULT_TEXT_SIZE = 18;

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
  onCrossRefClick?: (verseNum: number) => void;
  versesWithCrossRefs?: Set<number>;
  getVerseHighlightColor?: (verseNum: number) => HighlightColor | undefined;
  getVerseTextFormatting?: (verseNum: number) => TextFormatting[];
  useProtoSinaitic?: boolean;
  onToggleProtoSinaitic?: () => void;
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
  // Text size props (controlled from parent)
  textSize?: number;
  minTextSize?: number;
  maxTextSize?: number;
  onIncreaseTextSize?: () => void;
  onDecreaseTextSize?: () => void;
  // Footnotes (1611 KJV Marginal Notes)
  chapterFootnotes?: Map<number, FootnoteEntry[]>;
  showFootnotes?: boolean;
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
  onCrossRefClick,
  versesWithCrossRefs,
  getVerseHighlightColor,
  getVerseTextFormatting,
  useProtoSinaitic,
  onToggleProtoSinaitic,
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
  textSize: textSizeProp,
  minTextSize = 12,
  maxTextSize = 50,
  onIncreaseTextSize,
  onDecreaseTextSize,
  chapterFootnotes,
  showFootnotes = true,
}) => {
  const [isChapterSelectorOpen, setIsChapterSelectorOpen] = useState(false);
  const [isNavigationModalOpen, setIsNavigationModalOpen] = useState(false);

  // Use prop if provided, otherwise fallback to default
  const textSize = textSizeProp ?? DEFAULT_TEXT_SIZE;

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
          {screenShareMode && onSearch && onSearchResultClick ? (
            <div className="chapter-search-container">
              <SearchBox
                onSearch={onSearch}
                onResultClick={onSearchResultClick}
                onWordSearch={onWordSearch}
              />
            </div>
          ) : null}

          {/* Text Size Controls */}
          {onIncreaseTextSize && onDecreaseTextSize && (
            <div className="text-size-controls">
              <button
                className="text-size-btn"
                onClick={onDecreaseTextSize}
                disabled={textSize <= minTextSize}
                title="Decrease text size"
                aria-label="Decrease text size"
              >
                A−
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
                onCrossRefClick={onCrossRefClick}
                hasCrossRefs={versesWithCrossRefs?.has(verse.num)}
                globalUseProtoSinaitic={useProtoSinaitic}
                onToggleProtoSinaitic={onToggleProtoSinaitic}
                youthMode={youthMode}
                highlightColor={userHighlightColor}
                textFormatting={verseTextFormatting}
                footnotes={chapterFootnotes?.get(verse.num)}
                showFootnotes={showFootnotes}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChapterDisplay;
