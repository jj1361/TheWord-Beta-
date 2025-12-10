import React, { useRef, useEffect, useState } from 'react';
import { HighlightColor, HIGHLIGHT_COLORS, TextFormatStyle } from '../types/notes';
import './VerseHighlighter.css';

// Font colors that work well in both light and dark themes
const FONT_COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

// Background highlight colors - semi-transparent for better dark mode support
const TEXT_HIGHLIGHT_COLORS = [
  { name: 'None', value: 'transparent' },
  { name: 'Yellow', value: 'rgba(250, 204, 21, 0.4)' },
  { name: 'Green', value: 'rgba(74, 222, 128, 0.4)' },
  { name: 'Blue', value: 'rgba(96, 165, 250, 0.4)' },
  { name: 'Pink', value: 'rgba(244, 114, 182, 0.4)' },
  { name: 'Orange', value: 'rgba(251, 146, 60, 0.4)' },
  { name: 'Purple', value: 'rgba(192, 132, 252, 0.4)' },
];

export interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
}

interface VerseHighlighterProps {
  currentColor?: HighlightColor;
  onSelectColor: (color: HighlightColor) => void;
  onRemoveHighlight: () => void;
  onAddNote: () => void;
  onClose: () => void;
  position: { x: number; y: number };
  selectedText?: string;
  textSelection?: TextSelection;
  onApplyTextFormat?: (style: TextFormatStyle) => void;
  onClearTextFormat?: () => void;
  // Copy functionality props
  verseNum: number;
  bookName: string;
  chapterNum: number;
  verseText: string;
  totalVerses: number;
  onCopyVerseRange?: (startVerse: number, endVerse: number) => void;
}

const VerseHighlighter: React.FC<VerseHighlighterProps> = ({
  currentColor,
  onSelectColor,
  onRemoveHighlight,
  onAddNote,
  onClose,
  position,
  selectedText,
  textSelection,
  onApplyTextFormat,
  onClearTextFormat,
  verseNum,
  bookName,
  chapterNum,
  verseText,
  totalVerses,
  onCopyVerseRange,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [showFontColors, setShowFontColors] = useState(false);
  const [showTextHighlights, setShowTextHighlights] = useState(false);
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const [endVerse, setEndVerse] = useState(verseNum);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Check if there's text selected in the document
  const hasTextSelection = textSelection && textSelection.text.length > 0;

  // Reset range selector when verse changes
  useEffect(() => {
    setEndVerse(verseNum);
    setShowRangeSelector(false);
    setCopySuccess(null);
  }, [verseNum]);

  // Copy single verse to clipboard
  const handleCopySingleVerse = async () => {
    const reference = `${bookName} ${chapterNum}:${verseNum}`;
    const textToCopy = `${reference}\n${verseText}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess('Copied!');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      console.error('Failed to copy verse:', err);
    }
  };

  // Copy verse range
  const handleCopyRange = async () => {
    const startV = Math.min(verseNum, endVerse);
    const endV = Math.max(verseNum, endVerse);

    if (onCopyVerseRange) {
      onCopyVerseRange(startV, endV);
      setCopySuccess('Copied!');
      setTimeout(() => {
        onClose();
      }, 800);
    }
  };

  // Apply formatting and save it, then close the popup so the change is visible
  const applyFormat = (style: TextFormatStyle) => {
    if (onApplyTextFormat && hasTextSelection) {
      onApplyTextFormat(style);
      // Close the popup after applying so the user can see the formatted text
      onClose();
    }
  };

  const handleBold = () => applyFormat({ bold: true });
  const handleItalic = () => applyFormat({ italic: true });
  const handleUnderline = () => applyFormat({ underline: true });

  const handleFontColor = (color: string) => {
    applyFormat({ fontColor: color });
    setShowFontColors(false);
  };

  const handleTextHighlight = (color: string) => {
    if (color === 'transparent') {
      // Remove highlight - set backgroundColor to undefined
      applyFormat({ backgroundColor: undefined });
    } else {
      applyFormat({ backgroundColor: color });
    }
    setShowTextHighlights(false);
  };

  const handleClearFormatting = () => {
    if (onClearTextFormat && hasTextSelection) {
      onClearTextFormat();
      onClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep popup in viewport
  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust horizontal position
      if (rect.right > viewportWidth - 20) {
        adjustedX = viewportWidth - rect.width - 20;
      }
      if (rect.left < 20) {
        adjustedX = 20;
      }

      // Adjust vertical position
      if (rect.bottom > viewportHeight - 20) {
        adjustedY = position.y - rect.height - 10;
      }

      popupRef.current.style.left = `${adjustedX}px`;
      popupRef.current.style.top = `${adjustedY}px`;
    }
  }, [position]);

  return (
    <div
      ref={popupRef}
      className="verse-highlighter"
      style={{ left: position.x, top: position.y }}
    >
      {/* Rich Text Formatting Toolbar - shown when text is selected */}
      {hasTextSelection && (
        <>
          <div className="highlighter-section">
            <span className="highlighter-label">Format Text</span>
            <div className="text-format-toolbar">
              <button
                type="button"
                className="format-btn"
                onMouseDown={(e) => { e.preventDefault(); handleBold(); }}
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                className="format-btn"
                onMouseDown={(e) => { e.preventDefault(); handleItalic(); }}
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                className="format-btn"
                onMouseDown={(e) => { e.preventDefault(); handleUnderline(); }}
                title="Underline"
              >
                <u>U</u>
              </button>
              <div className="format-divider" />

              {/* Font Color Picker */}
              <div className="color-picker-wrapper">
                <button
                  type="button"
                  className="format-btn color-btn"
                  onClick={() => {
                    setShowFontColors(!showFontColors);
                    setShowTextHighlights(false);
                  }}
                  title="Font Color"
                >
                  A
                  <span className="color-bar" style={{ backgroundColor: 'var(--text-primary, #000)' }} />
                </button>
                {showFontColors && (
                  <div className="color-picker-dropdown">
                    {FONT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`color-option ${color.value === 'inherit' ? 'default-color' : ''}`}
                        style={{
                          backgroundColor: color.value === 'inherit' ? 'transparent' : color.value,
                          border: color.value === 'inherit' ? '2px dashed var(--text-secondary, #666)' : 'none'
                        }}
                        onMouseDown={(e) => { e.preventDefault(); handleFontColor(color.value); }}
                        title={color.name}
                      >
                        {color.value === 'inherit' && <span style={{ fontSize: '10px', color: 'var(--text-secondary, #666)' }}>Aa</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Highlight Color Picker */}
              <div className="color-picker-wrapper">
                <button
                  type="button"
                  className="format-btn highlight-text-btn"
                  onClick={() => {
                    setShowTextHighlights(!showTextHighlights);
                    setShowFontColors(false);
                  }}
                  title="Highlight Text"
                >
                  <span className="highlight-icon">H</span>
                </button>
                {showTextHighlights && (
                  <div className="color-picker-dropdown">
                    {TEXT_HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className="color-option"
                        style={{
                          backgroundColor: color.value === 'transparent' ? '#fff' : color.value,
                          border: color.value === 'transparent' ? '1px dashed #ccc' : 'none'
                        }}
                        onMouseDown={(e) => { e.preventDefault(); handleTextHighlight(color.value); }}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="format-divider" />

              {/* Clear Formatting Button */}
              <button
                type="button"
                className="format-btn clear-format-btn"
                onMouseDown={(e) => { e.preventDefault(); handleClearFormatting(); }}
                title="Clear Formatting"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="highlighter-divider" />
        </>
      )}

      {/* Verse Highlight Section */}
      <div className="highlighter-section">
        <span className="highlighter-label">Highlight Verse</span>
        <div className="highlight-colors">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.value}
              className={`highlight-color-btn ${currentColor === color.value ? 'active' : ''}`}
              style={{ backgroundColor: color.hex }}
              onClick={() => onSelectColor(color.value)}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {currentColor && (
        <button className="highlighter-action remove" onClick={onRemoveHighlight}>
          Remove Highlight
        </button>
      )}

      <div className="highlighter-divider" />

      <button className="highlighter-action note" onClick={onAddNote}>
        <span className="action-icon">📝</span>
        Add Note
      </button>

      <div className="highlighter-divider" />

      {/* Copy Verse Section */}
      {copySuccess ? (
        <div className="copy-success">
          <span className="copy-success-icon">✓</span>
          {copySuccess}
        </div>
      ) : showRangeSelector ? (
        <div className="copy-range-section">
          <div className="range-header">
            <button className="back-btn" onClick={() => setShowRangeSelector(false)}>
              ←
            </button>
            <span>Copy Range</span>
          </div>
          <div className="range-inputs">
            <div className="range-row">
              <span className="range-label">From:</span>
              <span className="range-value">Verse {verseNum}</span>
            </div>
            <div className="range-row">
              <span className="range-label">To:</span>
              <select
                value={endVerse}
                onChange={(e) => setEndVerse(Number(e.target.value))}
                className="range-select"
              >
                {Array.from({ length: totalVerses }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Verse {num}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="copy-range-btn" onClick={handleCopyRange}>
            Copy {bookName} {chapterNum}:{Math.min(verseNum, endVerse)}-{Math.max(verseNum, endVerse)}
          </button>
        </div>
      ) : (
        <>
          <button className="highlighter-action copy" onClick={handleCopySingleVerse}>
            <span className="action-icon">📋</span>
            Copy Verse {verseNum}
          </button>
          <button className="highlighter-action copy-range" onClick={() => setShowRangeSelector(true)}>
            <span className="action-icon">📑</span>
            Copy Verse Range...
          </button>
        </>
      )}
    </div>
  );
};

export default VerseHighlighter;
