import React from 'react';
import { Chapter, FootnoteEntry } from '../types/bible';
import VerseDisplay from './VerseDisplay';
import { WordImageMapping } from '../config/youthModeConfig';
import { HighlightColor, TextFormatting, Note } from '../types/notes';
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
  currentBookId?: number;
  // Text size props (controlled from parent)
  textSize?: number;
  // Footnotes (1611 KJV Marginal Notes)
  chapterFootnotes?: Map<number, FootnoteEntry[]>;
  showFootnotes?: boolean;
  // Notes props
  getNotesForVerse?: (verseNum: number) => Note[];
  onNoteClick?: (verseNum: number, notes: Note[]) => void;
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
  currentBookId,
  textSize: textSizeProp,
  chapterFootnotes,
  showFootnotes = true,
  getNotesForVerse,
  onNoteClick,
}) => {
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
      <div className="verses-container" style={{ '--verse-text-size': `${textSize}px` } as React.CSSProperties}>
        {chapter.kjvVerses.map((verse) => {
          const kjvsVerse = chapter.kjvsVerses?.find(
            (kv) => kv.num === verse.num
          );
          // Always provide interlinear data - button is always available
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
                bookId={currentBookId?.toString()}
                chapter={chapter?.chapterNum}
                notes={getNotesForVerse?.(verse.num)}
                onNoteClick={onNoteClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChapterDisplay;
