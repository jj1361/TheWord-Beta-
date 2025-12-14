import React, { useState, useEffect, useCallback } from 'react';
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
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [verseTexts, setVerseTexts] = useState<Map<string, string>>(new Map());
  const [displayedRefs, setDisplayedRefs] = useState<VerseWithText[]>([]);

  // Get refs for a specific topic with text
  const getRefsForTopic = useCallback((topicIndex: number, texts: Map<string, string>, entries: CrossRefEntry[]): VerseWithText[] => {
    if (topicIndex < 0 || topicIndex >= entries.length) return [];

    const entry = entries[topicIndex];
    const refsWithText: VerseWithText[] = entry.refs.map(ref => ({
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

    return refsWithText;
  }, []);

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
      setSelectedTopic(null);
      setDisplayedRefs([]);

      try {
        const refs = await crossRefService.getCrossRefs(bookId, chapter, verse);
        setCrossRefs(refs);

        // Load verse texts for all references
        const allRefs = getAllRefs(refs);
        const texts = await searchService.getVerseTexts(allRefs);
        setVerseTexts(texts);

        // Select first topic by default if available
        if (refs.length > 0) {
          setSelectedTopic(0);
          setDisplayedRefs(getRefsForTopic(0, texts, refs));
        }
      } catch (error) {
        console.error('Error loading cross-references:', error);
        setCrossRefs([]);
      }
      setLoading(false);
    };

    loadCrossRefs();
  }, [bookId, chapter, verse, getAllRefs, getRefsForTopic]);

  const handleTopicClick = (index: number) => {
    setSelectedTopic(index);
    setDisplayedRefs(getRefsForTopic(index, verseTexts, crossRefs));
  };

  const handleRefClick = (ref: CrossReference) => {
    onNavigate(ref.bookId, ref.chapter, ref.verse);
  };

  const totalRefs = crossRefs.reduce((sum, entry) => sum + entry.refs.length, 0);

  return (
    <div className="cross-ref-panel">
      <div className="cross-ref-header">
        <div className="cross-ref-title">
          <h3>Cross References</h3>
          <span
            className="cross-ref-verse clickable"
            onClick={() => onNavigate(bookId, chapter, verse)}
            title="Go to this verse"
          >
            {bookName} {chapter}:{verse}
          </span>
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

            {/* Topic Buttons */}
            <div className="cross-ref-topics">
              {crossRefs.map((entry, index) => (
                <button
                  key={index}
                  className={`cross-ref-topic-btn ${selectedTopic === index ? 'selected' : ''}`}
                  onClick={() => handleTopicClick(index)}
                >
                  <span className="topic-word">{entry.word || `Topic ${index + 1}`}</span>
                  <span className="topic-count">{entry.refs.length}</span>
                </button>
              ))}
            </div>

            {/* Scriptures List for Selected Topic */}
            <div className="cross-ref-all-verses">
              <div className="cross-ref-all-header">
                <span>
                  {selectedTopic !== null && crossRefs[selectedTopic]
                    ? `"${crossRefs[selectedTopic].word || `Topic ${selectedTopic + 1}`}" Scriptures`
                    : 'All Scriptures'}
                </span>
                <span className="cross-ref-all-count">{displayedRefs.length}</span>
              </div>
              <div className="cross-ref-verses-list">
                {displayedRefs.length === 0 ? (
                  <div className="cross-ref-empty-topic">
                    <p>Select a topic above to view scriptures</p>
                  </div>
                ) : (
                  displayedRefs.map((ref, index) => (
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
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CrossReferencePanel;
