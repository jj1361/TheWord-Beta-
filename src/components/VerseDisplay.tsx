import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { KJVVerse, KJVsVerse, InterlinearVerse, FootnoteEntry } from '../types/bible';
import { extractHebrewLetters, getHebrewLetterInfo, HebrewLetterInfo } from '../config/hebrewLetters';
import { getWordImage, getImagePath, getImageSize, WordImageMapping } from '../config/youthModeConfig';
import { HighlightColor, HIGHLIGHT_COLORS, TextFormatting } from '../types/notes';
import { getPartOfSpeechName } from '../utils/partsOfSpeech';
import { useTranslation } from '../contexts/TranslationContext';
import { LexiconData } from '../types/lexicon';
import { CrossReference } from '../services/crossRefService';
import InlineRightPanelContent from './InlineRightPanelContent';
import './VerseDisplay.css';

// Tooltip state interface
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  pos: string;
  parse: string;
}

// Footnote tooltip state
interface FootnoteTooltipState {
  visible: boolean;
  x: number;
  y: number;
  footnote: FootnoteEntry | null;
}

interface CrossRefContext {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
}

interface VerseDisplayProps {
  verse: KJVVerse;
  kjvsVerse?: KJVsVerse;
  interlinearVerse?: InterlinearVerse;
  onLetterClick?: (letter: string) => void;
  onStrongsClick?: (strongs: string) => void;
  onPersonClick?: (personID: string) => void;
  onYouthImageClick?: (wordMapping: WordImageMapping) => void;
  isSelected?: boolean;
  onVerseClick?: (verseNum: number) => void;
  onCrossRefClick?: (verseNum: number) => void;
  hasCrossRefs?: boolean;
  globalUseProtoSinaitic?: boolean;
  onToggleProtoSinaitic?: () => void;
  youthMode?: boolean;
  highlightColor?: HighlightColor;
  textFormatting?: TextFormatting[];
  // Footnotes (1611 KJV Marginal Notes)
  footnotes?: FootnoteEntry[];
  showFootnotes?: boolean;
  // Webcam mode inline panel props - display lexicon info in interlinear area
  webcamMode?: boolean;
  inlinePanelLexicon?: LexiconData | null;
  inlinePanelHebrewLetter?: HebrewLetterInfo | null;
  inlinePanelCrossRefContext?: CrossRefContext | null;
  inlinePanelCrossRefVerses?: Array<CrossReference & { text?: string }>;
  onCloseInlinePanel?: () => void;
  onInlinePanelVerseClick?: (bookId: number, chapter: number, verse: number) => void;
}

const VerseDisplay: React.FC<VerseDisplayProps> = ({
  verse,
  kjvsVerse,
  interlinearVerse,
  onLetterClick,
  onStrongsClick,
  onPersonClick,
  onYouthImageClick,
  isSelected,
  onVerseClick,
  onCrossRefClick,
  hasCrossRefs,
  globalUseProtoSinaitic,
  onToggleProtoSinaitic,
  youthMode,
  highlightColor,
  textFormatting,
  footnotes,
  showFootnotes = true,
  webcamMode,
  inlinePanelLexicon,
  inlinePanelHebrewLetter,
  inlinePanelCrossRefContext,
  inlinePanelCrossRefVerses,
  onCloseInlinePanel,
  onInlinePanelVerseClick,
}) => {
  const { currentTranslation } = useTranslation();
  const [localUseProtoSinaitic, setLocalUseProtoSinaitic] = useState(false);
  const [forwardInterlinear, setForwardInterlinear] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [posTooltip, setPosTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    pos: '',
    parse: ''
  });
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Footnote tooltip state
  const [footnoteTooltip, setFootnoteTooltip] = useState<FootnoteTooltipState>({
    visible: false,
    x: 0,
    y: 0,
    footnote: null
  });
  const footnoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track which phrase to highlight when hovering over footnote
  const [highlightedPhrase, setHighlightedPhrase] = useState<string | null>(null);

  // Handle POS tooltip show
  const handlePosMouseEnter = (e: React.MouseEvent, pos: string, parse: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    // Clear any pending hide timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setPosTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      pos,
      parse
    });
  };

  // Handle POS tooltip hide with delay
  const handlePosMouseLeave = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setPosTooltip(prev => ({ ...prev, visible: false }));
    }, 100);
  };

  // Handle footnote tooltip show
  const handleFootnoteMouseEnter = (e: React.MouseEvent, footnote: FootnoteEntry) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    if (footnoteTimeoutRef.current) {
      clearTimeout(footnoteTimeoutRef.current);
      footnoteTimeoutRef.current = null;
    }
    setFootnoteTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      footnote
    });
    // Highlight the referenced phrase in the verse text
    setHighlightedPhrase(footnote.phrase);
  };

  // Handle footnote tooltip hide with delay
  const handleFootnoteMouseLeave = () => {
    footnoteTimeoutRef.current = setTimeout(() => {
      setFootnoteTooltip(prev => ({ ...prev, visible: false }));
      setHighlightedPhrase(null);
    }, 150);
  };

  // Get footnote type label
  const getFootnoteTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      hebrew: 'Heb.',
      greek: 'Gr.',
      alternative: 'Or',
      meaning: 'i.e.',
      clarification: 'Note'
    };
    return labels[type] || 'Note';
  };

  // Wrap highlighted phrase in text with animation span
  const wrapHighlightedPhrase = (text: string): React.ReactNode => {
    if (!highlightedPhrase) return text;

    // Case-insensitive search for the phrase
    const lowerText = text.toLowerCase();
    const lowerPhrase = highlightedPhrase.toLowerCase();
    const index = lowerText.indexOf(lowerPhrase);

    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + highlightedPhrase.length);
    const after = text.slice(index + highlightedPhrase.length);

    return (
      <>
        {before}
        <span className="footnote-phrase-highlight">{match}</span>
        {after}
      </>
    );
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      if (footnoteTimeoutRef.current) {
        clearTimeout(footnoteTimeoutRef.current);
      }
    };
  }, []);

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Use global setting if provided, otherwise use local state
  const useProtoSinaitic = globalUseProtoSinaitic !== undefined ? globalUseProtoSinaitic : localUseProtoSinaitic;

  // Get resolved formatting positions for the verse text
  const getResolvedFormats = (text: string) => {
    if (!textFormatting || textFormatting.length === 0) {
      return [];
    }

    const resolvedFormats: { startOffset: number; endOffset: number; style: React.CSSProperties; selectedText: string }[] = [];

    textFormatting.forEach((format) => {
      const style: React.CSSProperties = {};
      if (format.style.bold) style.fontWeight = 'bold';
      if (format.style.italic) style.fontStyle = 'italic';
      if (format.style.underline) style.textDecoration = 'underline';
      if (format.style.fontColor && format.style.fontColor !== 'inherit') {
        style.color = format.style.fontColor;
      }
      if (format.style.backgroundColor) style.backgroundColor = format.style.backgroundColor;

      let startOffset = format.startOffset;
      let endOffset = format.endOffset;

      const textAtStoredOffset = text.substring(startOffset, endOffset);
      if (textAtStoredOffset !== format.selectedText) {
        const foundIndex = text.indexOf(format.selectedText);
        if (foundIndex !== -1) {
          startOffset = foundIndex;
          endOffset = foundIndex + format.selectedText.length;
        } else {
          return;
        }
      }

      resolvedFormats.push({ startOffset, endOffset, style, selectedText: format.selectedText });
    });

    // Merge overlapping formats
    const mergedFormats = new Map<string, { startOffset: number; endOffset: number; style: React.CSSProperties }>();
    resolvedFormats.forEach((format) => {
      const key = `${format.startOffset}-${format.endOffset}`;
      const existing = mergedFormats.get(key);
      if (existing) {
        mergedFormats.set(key, { ...format, style: { ...existing.style, ...format.style } });
      } else {
        mergedFormats.set(key, format);
      }
    });

    return Array.from(mergedFormats.values()).sort((a, b) => a.startOffset - b.startOffset);
  };

  // Apply text formatting to a piece of text given the character offset range it represents
  const applyFormattingToText = (
    text: string,
    textStartOffset: number,
    formats: { startOffset: number; endOffset: number; style: React.CSSProperties }[]
  ): React.ReactNode => {
    const textEndOffset = textStartOffset + text.length;

    // Find formats that overlap with this text range
    const relevantFormats = formats.filter(
      f => f.startOffset < textEndOffset && f.endOffset > textStartOffset
    );

    if (relevantFormats.length === 0) {
      return text;
    }

    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    relevantFormats.forEach((format, idx) => {
      // Calculate the local offsets within this text
      const localStart = Math.max(0, format.startOffset - textStartOffset);
      const localEnd = Math.min(text.length, format.endOffset - textStartOffset);

      if (localStart < lastIndex || localStart >= localEnd) {
        return;
      }

      // Add unformatted text before this format
      if (localStart > lastIndex) {
        result.push(<span key={`t-${lastIndex}`}>{text.substring(lastIndex, localStart)}</span>);
      }

      // Add formatted text
      result.push(
        <span key={`f-${idx}`} style={format.style} className="formatted-text">
          {text.substring(localStart, localEnd)}
        </span>
      );

      lastIndex = localEnd;
    });

    // Add remaining unformatted text
    if (lastIndex < text.length) {
      result.push(<span key={`t-end`}>{text.substring(lastIndex)}</span>);
    }

    return result.length === 1 ? result[0] : <>{result}</>;
  };

  // Apply text formatting to a string (standalone, used when no clickable phrases)
  const applyTextFormatting = (text: string): React.ReactNode => {
    const formats = getResolvedFormats(text);
    if (formats.length === 0) {
      return text;
    }
    return applyFormattingToText(text, 0, formats);
  };

  const handleVerseContainerClick = (e: React.MouseEvent) => {
    // Only handle clicks on interactive elements, don't toggle interlinear on container click
    const target = e.target as HTMLElement;
    if (target.closest('.hebrew-letter.clickable') ||
        target.closest('.word-strongs.clickable') ||
        target.closest('.person-link') ||
        target.closest('.clickable-phrase') ||
        target.closest('.proto-toggle-btn') ||
        target.closest('.close-interlinear-btn') ||
        target.closest('.interlinear-toggle-btn')) {
      return;
    }
    // Don't call onVerseClick here - interlinear is only toggled via the button
  };

  const handleCloseInterlinear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVerseClick) {
      onVerseClick(verse.num); // Toggle off the selection
    }
  };

  const handlePersonLinkClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const personID = target.getAttribute('data-person-id');
    if (personID && onPersonClick) {
      e.stopPropagation();
      onPersonClick(personID);
    }
  };

  const handlePhraseClick = (e: React.MouseEvent, strongs: string) => {
    e.stopPropagation();
    if (onStrongsClick && strongs) {
      onStrongsClick(strongs);
    }
  };

  // Render text with youth mode image replacements
  const renderYouthModeText = (text: string): React.ReactNode => {
    if (!youthMode) {
      return text;
    }

    // Split text into words while preserving punctuation and spaces
    const parts = text.split(/(\s+)/);

    return parts.map((part, index) => {
      // Skip whitespace parts
      if (/^\s+$/.test(part)) {
        return <span key={index}>{part}</span>;
      }

      // Check if this word has an image mapping
      const wordImage = getWordImage(part);
      if (wordImage) {
        // Extract any leading/trailing punctuation
        const leadingPunct = part.match(/^[.,;:!?'"()[\]{}]+/)?.[0] || '';
        const trailingPunct = part.match(/[.,;:!?'"()[\]{}]+$/)?.[0] || '';

        return (
          <span key={index} className="youth-word-container">
            {leadingPunct}
            <span
              className={`youth-image-wrapper ${onYouthImageClick ? 'clickable' : ''}`}
              title={wordImage.tooltip || wordImage.alt}
              onClick={(e) => {
                if (onYouthImageClick) {
                  e.stopPropagation();
                  onYouthImageClick(wordImage);
                }
              }}
            >
              <img
                src={getImagePath(wordImage.image)}
                alt={wordImage.alt}
                className="youth-word-image"
                style={{
                  height: getImageSize(wordImage).height,
                  maxWidth: getImageSize(wordImage).maxWidth,
                }}
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className="youth-word-fallback hidden">{part}</span>
            </span>
            {trailingPunct}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const renderClickablePhrases = (addPersonLinks: boolean = false, formats: { startOffset: number; endOffset: number; style: React.CSSProperties }[] = []) => {
    if (!kjvsVerse || !onStrongsClick) {
      return <span className="verse-text">{renderYouthModeText(verse.text)}</span>;
    }

    // Track the current character offset in the full verse text
    let currentOffset = 0;

    return (
      <span className="verse-text">
        {kjvsVerse.phrases.map((phrase, idx) => {
          // Skip empty phrases (untranslated particles)
          if (!phrase.text || phrase.text.trim().length === 0) {
            return null;
          }

          const phraseStartOffset = currentOffset;
          const phraseText = phrase.text;

          // Update current offset for next phrase (include space if needed)
          const needsSpaceAfter = () => {
            if (idx >= kjvsVerse.phrases.length - 1) return false;
            if (!phraseText || phraseText.trim() === '') return false;
            if (phraseText.match(/\s$/)) return false;
            for (let i = idx + 1; i < kjvsVerse.phrases.length; i++) {
              const nextPhrase = kjvsVerse.phrases[i];
              if (nextPhrase?.text && nextPhrase.text.trim() !== '') {
                if (nextPhrase.text.match(/^[\s,;:.!?\-']/)) return false;
                return true;
              }
            }
            return false;
          };

          const addSpace = needsSpaceAfter();
          currentOffset += phraseText.length + (addSpace ? 1 : 0);

          // Check if this phrase has any formatting applied
          const hasFormatting = formats.length > 0 && formats.some(
            f => f.startOffset < phraseStartOffset + phraseText.length && f.endOffset > phraseStartOffset
          );

          // Handle person links (only when not using formatting, as dangerouslySetInnerHTML conflicts)
          // Only use mdText person links for KJV translation
          let usePersonLinks = false;
          let phraseContentHtml = '';
          if (addPersonLinks && verse.mdText && !hasFormatting && currentTranslation === 'kjv') {
            const personLinkPattern = /\[([^\]]+)\]\(\[\/person\/([^)]+)\)/g;
            let match;
            let tempContent = phraseText;
            while ((match = personLinkPattern.exec(verse.mdText)) !== null) {
              const personName = match[1];
              const personID = match[2];
              if (tempContent.includes(personName)) {
                tempContent = tempContent.replace(
                  personName,
                  `<span class="person-link" data-person-id="${personID}">${personName}</span>`
                );
                usePersonLinks = true;
              }
            }
            if (usePersonLinks) {
              phraseContentHtml = tempContent;
            }
          }

          // Render phrase content with formatting if applicable
          let phraseContent: React.ReactNode;
          if (hasFormatting) {
            phraseContent = applyFormattingToText(phraseText, phraseStartOffset, formats);
          } else if (usePersonLinks) {
            phraseContent = null; // Will use dangerouslySetInnerHTML
          } else if (youthMode) {
            phraseContent = renderYouthModeText(phraseText);
          } else {
            phraseContent = phraseText;
          }

          // Check if this phrase matches the footnote highlighted phrase
          const isFootnoteHighlighted = highlightedPhrase &&
            phraseText.toLowerCase().includes(highlightedPhrase.toLowerCase());

          return (
            <React.Fragment key={idx}>
              <span
                className={`clickable-phrase ${isFootnoteHighlighted ? 'footnote-phrase-highlight' : ''}`}
                onClick={(e) => handlePhraseClick(e, phrase.strongs)}
                onClickCapture={addPersonLinks && !hasFormatting ? handlePersonLinkClick : undefined}
                title={`Strong's #${phrase.strongs} - Click for lexicon`}
                dangerouslySetInnerHTML={usePersonLinks ? { __html: phraseContentHtml } : undefined}
              >
                {!usePersonLinks ? phraseContent : null}
              </span>
              {addSpace && ' '}
            </React.Fragment>
          );
        })}
      </span>
    );
  };

  const renderVerseText = () => {
    const processItalics = (text: string): string => {
      // Match words that start and end with underscores
      // This will match _word_ and remove the underscores while wrapping in <em>
      return text.replace(/\b_([^_\s]+)_\b/g, '<em>$1</em>');
    };

    // Get any text formatting that should be applied
    const formats = getResolvedFormats(verse.text);

    // Priority 1: If we have KJVs data with Strong's numbers, use clickable phrases
    // Clickable phrases now support text formatting within them
    if (kjvsVerse && onStrongsClick) {
      // Only use person links (mdText) for KJV translation
      return renderClickablePhrases(!!verse.mdText && currentTranslation === 'kjv', formats);
    }

    // Priority 2: If we have text formatting but no clickable phrases, apply formatting
    if (formats.length > 0) {
      return <span className="verse-text">{applyTextFormatting(verse.text)}</span>;
    }

    // Priority 3: If we have mdText with person links but no KJVs data
    // Only use mdText for KJV translation (it contains English text with person links)
    if (verse.mdText && currentTranslation === 'kjv') {
      // Replace [Name]([/person/personID) with clickable spans
      const personLinkPattern = /\[([^\]]+)\]\(\[\/person\/([^)]+)\)/g;
      let html = verse.mdText.replace(personLinkPattern, (_match, name, personID) => {
        return `<span class="person-link" data-person-id="${personID}">${name}</span>`;
      });

      // Apply italic formatting
      html = processItalics(html);

      return (
        <span
          className="verse-text"
          dangerouslySetInnerHTML={{ __html: html }}
          onClick={handlePersonLinkClick}
        />
      );
    }

    // Priority 4: For plain text, apply italic formatting
    const processedText = processItalics(verse.text);
    if (processedText !== verse.text) {
      return (
        <span
          className="verse-text"
          dangerouslySetInnerHTML={{ __html: processedText }}
        />
      );
    }

    // Fallback: Plain text (with youth mode support or phrase highlighting)
    if (youthMode) {
      return <span className="verse-text">{renderYouthModeText(verse.text)}</span>;
    }

    // Apply phrase highlighting if active
    if (highlightedPhrase) {
      return <span className="verse-text">{wrapHighlightedPhrase(verse.text)}</span>;
    }

    return <span className="verse-text">{verse.text}</span>;
  };

  const renderHebrewText = (hebrewText: string) => {
    if (!hebrewText) return '—';

    const letters = extractHebrewLetters(hebrewText);

    return (
      <span className={`hebrew-text-container ${useProtoSinaitic ? 'proto-sinaitic' : ''}`}>
        {letters.map((letter, idx) => {
          const letterInfo = getHebrewLetterInfo(letter);
          const isClickable = letterInfo !== null;
          const displayChar = useProtoSinaitic && letterInfo ? letterInfo.ancientScript : letter;

          return (
            <span
              key={idx}
              className={`hebrew-letter ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && onLetterClick && onLetterClick(letter)}
              title={letterInfo ? letterInfo.name : ''}
            >
              {displayChar}
            </span>
          );
        })}
      </span>
    );
  };

  // Get the hex color for the highlight based on current theme
  const getHighlightHex = (): string | undefined => {
    if (!highlightColor) return undefined;
    const color = HIGHLIGHT_COLORS.find(c => c.value === highlightColor);
    if (!color) return undefined;

    return isDarkMode ? color.hexDark : color.hexLight;
  };

  return (
    <div
      className={`verse-container ${isSelected ? 'selected' : ''} ${highlightColor ? 'user-highlighted' : ''}`}
      onClick={handleVerseContainerClick}
      style={highlightColor ? { backgroundColor: getHighlightHex() } : undefined}
    >
      <div className="verse-main">
        <span className="verse-number">{verse.num}</span>
        {renderVerseText()}
        {/* Footnote superscripts */}
        {showFootnotes && footnotes && footnotes.length > 0 && (
          <span className="footnote-indicators">
            {footnotes.map((fn, idx) => (
              <sup
                key={idx}
                className={`footnote-superscript footnote-type-${fn.type}`}
                onMouseEnter={(e) => handleFootnoteMouseEnter(e, fn)}
                onMouseLeave={handleFootnoteMouseLeave}
              >
                †{footnotes.length > 1 ? <span className="footnote-count">{idx + 1}</span> : ''}
              </sup>
            ))}
          </span>
        )}
        {hasCrossRefs && onCrossRefClick && (
          <button
            className="cross-ref-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              onCrossRefClick(verse.num);
            }}
            title="Show Cross References"
          >
            ✝
          </button>
        )}
        {interlinearVerse && onVerseClick && (
          <button
            className={`interlinear-toggle-btn ${isSelected ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onVerseClick(verse.num);
            }}
            title={isSelected ? 'Hide Interlinear' : 'Show Interlinear'}
          >
            ℹ
          </button>
        )}
      </div>

      {/* Interlinear section - shown when verse is selected AND interlinear data exists */}
      {isSelected && interlinearVerse && (
        <div className="interlinear-section">
          <div className="interlinear-header">
            <span>Interlinear Analysis</span>
            <div className="interlinear-header-right">
              <button
                className={`interlinear-direction-btn ${forwardInterlinear ? 'forward' : 'reverse'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setForwardInterlinear(!forwardInterlinear);
                }}
                title={forwardInterlinear ? 'Switch to Reverse (Original first)' : 'Switch to Forward (English first)'}
              >
                {forwardInterlinear ? '→ Forward' : '← Reverse'}
              </button>
              <button
                className={`proto-toggle-btn ${useProtoSinaitic ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleProtoSinaitic) {
                    onToggleProtoSinaitic();
                  } else {
                    setLocalUseProtoSinaitic(!localUseProtoSinaitic);
                  }
                }}
                title={useProtoSinaitic ? 'Switch to Modern Hebrew' : 'Switch to Proto-Sinaitic (Ancient Hebrew)'}
              >
                {useProtoSinaitic ? '𐤀 Ancient' : 'א Modern'}
              </button>
              <span className="interlinear-hint">Click any Hebrew letter to see its meaning</span>
              <button
                className="close-interlinear-btn"
                onClick={handleCloseInterlinear}
                title="Close Interlinear Analysis"
              >
                ✕
              </button>
            </div>
          </div>
          <div className={`interlinear-words ${forwardInterlinear ? 'forward-mode' : 'reverse-mode'}`}>
            {(forwardInterlinear && interlinearVerse.words[0]?.hebrew
              ? [...interlinearVerse.words].reverse()
              : interlinearVerse.words
            ).map((word, idx) => (
              <div key={idx} className={`interlinear-word ${forwardInterlinear ? 'forward' : 'reverse'}`}>
                {forwardInterlinear ? (
                  <>
                    <div className="word-english">
                      {word.english}
                    </div>
                    <div className="word-transliteration">
                      {word.transliteration}
                    </div>
                    <div className="word-original">
                      {word.hebrew ? renderHebrewText(word.hebrew) : word.greek || '—'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="word-original">
                      {word.hebrew ? renderHebrewText(word.hebrew) : word.greek || '—'}
                    </div>
                    <div className="word-transliteration">
                      {word.transliteration}
                    </div>
                    <div className="word-english">
                      {word.english}
                    </div>
                  </>
                )}
                <div className="word-details">
                  {word.strongs && word.strongs.trim() && (
                    <div
                      className={`word-strongs ${onStrongsClick ? 'clickable' : ''}`}
                      title="Strong's Number - Click for lexicon"
                      onClick={() => onStrongsClick && onStrongsClick(word.strongs)}
                    >
                      #{word.strongs}
                    </div>
                  )}
                  <div
                    className="word-pos"
                    onMouseEnter={(e) => handlePosMouseEnter(e, word.pos, word.parse)}
                    onMouseLeave={handlePosMouseLeave}
                  >
                    {word.pos}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline Panel Content - shown in webcam mode when lexicon/crossref data exists */}
      {/* This is separate from interlinear-section - only shows lexicon info when clicking words */}
      {webcamMode && (inlinePanelLexicon || inlinePanelHebrewLetter || inlinePanelCrossRefContext) && (
        <div className="inline-panel-in-verse">
          <InlineRightPanelContent
            lexiconContent={inlinePanelLexicon || null}
            hebrewLetterContent={inlinePanelHebrewLetter || null}
            crossRefContext={inlinePanelCrossRefContext}
            crossRefVerses={inlinePanelCrossRefVerses}
            onClose={onCloseInlinePanel || (() => {})}
            onVerseClick={onInlinePanelVerseClick}
            onStrongsClick={onStrongsClick}
          />
        </div>
      )}

      {/* POS Tooltip */}
      {posTooltip.visible && (
        <div
          className="pos-tooltip"
          style={{
            position: 'fixed',
            left: posTooltip.x,
            top: posTooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="pos-tooltip-content">
            <div className="pos-tooltip-main">
              <span className="pos-tooltip-abbrev">{posTooltip.pos}</span>
              <span className="pos-tooltip-meaning">{getPartOfSpeechName(posTooltip.pos)}</span>
            </div>
            {posTooltip.parse && (
              <div className="pos-tooltip-parse">{posTooltip.parse}</div>
            )}
          </div>
        </div>
      )}

      {/* Footnote Tooltip - rendered via portal to escape stacking contexts */}
      {footnoteTooltip.visible && footnoteTooltip.footnote && createPortal(
        <div
          className="footnote-tooltip"
          style={{
            position: 'fixed',
            left: footnoteTooltip.x,
            top: footnoteTooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
          onMouseEnter={() => {
            if (footnoteTimeoutRef.current) {
              clearTimeout(footnoteTimeoutRef.current);
              footnoteTimeoutRef.current = null;
            }
          }}
          onMouseLeave={handleFootnoteMouseLeave}
        >
          <div className="footnote-tooltip-content">
            <div className="footnote-tooltip-header">
              <span className={`footnote-type-badge footnote-type-${footnoteTooltip.footnote.type}`}>
                {getFootnoteTypeLabel(footnoteTooltip.footnote.type)}
              </span>
              <span className="footnote-phrase">"{footnoteTooltip.footnote.phrase}"</span>
            </div>
            <div className="footnote-tooltip-note">
              {footnoteTooltip.footnote.note}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VerseDisplay;
