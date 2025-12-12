import React, { useState, useEffect, useCallback, useRef } from 'react';
import { crossRefService, CrossRefEntry, CrossReference } from '../services/crossRefService';
import { searchService } from '../services/searchService';
import './CrossReferencePanel.css';

interface CrossReferencePanelProps {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  onNavigate: (bookId: number, chapter: number, verse: number) => void;
  onClose: () => void;
}

interface VerseWithText extends CrossReference {
  text?: string;
  refKey: string;
}

interface TooltipPosition {
  x: number;
  y: number;
  showAbove: boolean;
}

const CrossReferencePanel: React.FC<CrossReferencePanelProps> = ({
  bookId,
  bookName,
  chapter,
  verse,
  onNavigate,
  onClose,
}) => {
  const [crossRefs, setCrossRefs] = useState<CrossRefEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));
  const [verseTexts, setVerseTexts] = useState<Map<string, string>>(new Map());
  const [hoveredRef, setHoveredRef] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [allRefsWithText, setAllRefsWithText] = useState<VerseWithText[]>([]);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Collect all unique references
  const getAllRefs = useCallback((entries: CrossRefEntry[]): CrossReference[] => {
    const seen = new Set<string>();
    const refs: CrossReference[] = [];

    for (const entry of entries) {
      for (const ref of entry.refs) {
        const key = `${ref.bookId}:${ref.chapter}:${ref.verse}`;
        if (!seen.has(key)) {
          seen.add(key);
          refs.push(ref);
        }
      }
    }

    return refs;
  }, []);

  useEffect(() => {
    const loadCrossRefs = async () => {
      setLoading(true);
      try {
        const refs = await crossRefService.getCrossRefs(bookId, chapter, verse);
        setCrossRefs(refs);

        // Expand first group by default
        if (refs.length > 0) {
          setExpandedGroups(new Set([0]));
        }

        // Load verse texts for all references
        const allRefs = getAllRefs(refs);
        const texts = await searchService.getVerseTexts(allRefs);
        setVerseTexts(texts);

        // Build all refs with text for the bottom list
        const refsWithText: VerseWithText[] = allRefs.map(ref => ({
          ...ref,
          refKey: `${ref.bookId}:${ref.chapter}:${ref.verse}`,
          text: texts.get(`${ref.bookId}:${ref.chapter}:${ref.verse}`)
        }));

        // Sort by book order
        refsWithText.sort((a, b) => {
          if (a.bookId !== b.bookId) return a.bookId - b.bookId;
          if (a.chapter !== b.chapter) return a.chapter - b.chapter;
          return a.verse - b.verse;
        });

        setAllRefsWithText(refsWithText);
      } catch (error) {
        console.error('Error loading cross-references:', error);
        setCrossRefs([]);
      }
      setLoading(false);
    };

    loadCrossRefs();
  }, [bookId, chapter, verse, getAllRefs]);

  const toggleGroup = (index: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleRefClick = (ref: CrossReference) => {
    onNavigate(ref.bookId, ref.chapter, ref.verse);
  };

  const getRefKey = (ref: CrossReference) => `${ref.bookId}:${ref.chapter}:${ref.verse}`;

  const handleMouseEnter = (refKey: string, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipHeight = 150; // Approximate tooltip height
    const spaceAbove = rect.top;
    const showAbove = spaceAbove > tooltipHeight;

    setHoveredRef(refKey);
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: showAbove ? rect.top - 8 : rect.bottom + 8,
      showAbove
    });
  };

  const handleMouseLeave = () => {
    setHoveredRef(null);
    setTooltipPosition(null);
  };

  const totalRefs = crossRefs.reduce((sum, entry) => sum + entry.refs.length, 0);

  // Get the current hovered verse text
  const hoveredVerseText = hoveredRef ? verseTexts.get(hoveredRef) : null;
  const hoveredRefData = hoveredRef ? allRefsWithText.find(r => r.refKey === hoveredRef) : null;

  return (
    <div className="cross-ref-panel">
      <div className="cross-ref-header">
        <div className="cross-ref-title">
          <h3>Cross References</h3>
          <span className="cross-ref-verse">{bookName} {chapter}:{verse}</span>
        </div>
        <button className="cross-ref-close" onClick={onClose}>×</button>
      </div>

      <div className="cross-ref-content">
        {loading ? (
          <div className="cross-ref-loading">Loading cross-references...</div>
        ) : crossRefs.length === 0 ? (
          <div className="cross-ref-empty">
            <p>No cross-references found for this verse.</p>
          </div>
        ) : (
          <>
            <div className="cross-ref-summary">
              {crossRefs.length} topic{crossRefs.length !== 1 ? 's' : ''} • {totalRefs} reference{totalRefs !== 1 ? 's' : ''}
            </div>

            <div className="cross-ref-groups">
              {crossRefs.map((entry, index) => (
                <div key={index} className="cross-ref-group">
                  <button
                    className={`cross-ref-group-header ${expandedGroups.has(index) ? 'expanded' : ''}`}
                    onClick={() => toggleGroup(index)}
                  >
                    <span className="cross-ref-word">{entry.word || `Topic ${index + 1}`}</span>
                    <span className="cross-ref-count">{entry.refs.length}</span>
                    <span className="cross-ref-expand-icon">{expandedGroups.has(index) ? '▼' : '▶'}</span>
                  </button>

                  {expandedGroups.has(index) && (
                    <div className="cross-ref-list">
                      {entry.refs.map((ref, refIndex) => {
                        const refKey = getRefKey(ref);
                        return (
                          <div
                            key={refIndex}
                            className="cross-ref-item-wrapper"
                            onMouseEnter={(e) => handleMouseEnter(refKey, e)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <button
                              className="cross-ref-item"
                              onClick={() => handleRefClick(ref)}
                            >
                              {crossRefService.formatShortReference(ref)}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* All Scriptures List */}
            <div className="cross-ref-all-verses">
              <div className="cross-ref-all-header">
                <span>All Scriptures</span>
                <span className="cross-ref-all-count">{allRefsWithText.length}</span>
              </div>
              <div className="cross-ref-verses-list">
                {allRefsWithText.map((ref, index) => (
                  <div
                    key={index}
                    className="cross-ref-verse-item"
                    onClick={() => handleRefClick(ref)}
                  >
                    <div className="cross-ref-verse-ref">
                      {crossRefService.formatReference(ref)}
                    </div>
                    <div className="cross-ref-verse-text">
                      {ref.text || 'Loading...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fixed position tooltip that renders outside the scrolling container */}
      {hoveredRef && tooltipPosition && hoveredVerseText && hoveredRefData && (
        <div
          ref={tooltipRef}
          className={`cross-ref-tooltip ${tooltipPosition.showAbove ? 'above' : 'below'}`}
          style={{
            left: tooltipPosition.x,
            transform: 'translateX(-50%)',
            ...(tooltipPosition.showAbove
              ? { bottom: window.innerHeight - tooltipPosition.y }
              : { top: tooltipPosition.y })
          }}
        >
          <strong>{crossRefService.formatReference(hoveredRefData)}</strong>
          <p>{hoveredVerseText}</p>
        </div>
      )}
    </div>
  );
};

export default CrossReferencePanel;
