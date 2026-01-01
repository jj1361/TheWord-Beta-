import React, { useState, useEffect, useCallback } from 'react';
import { crossRefService, CrossRefEntry, CrossReference } from '../services/crossRefService';
import { searchService } from '../services/searchService';
import { Note, Topic, VerseReference } from '../types/notes';
import './CrossReferencePanel.css';

interface CrossReferencePanelProps {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  onNavigate: (bookId: number, chapter: number, verse: number) => void;
  onClose: () => void;
  // Notes integration
  notes?: Note[];
  topics?: Topic[];
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (id: string) => void;
  onCreateNote?: (verseRef?: VerseReference) => void;
  showNotesPanel?: boolean;
  onToggleNotesPanel?: () => void;
}

interface VerseWithText extends CrossReference {
  text?: string;
  refKey: string;
}

type TabType = 'treasury' | 'myRefs';

const CrossReferencePanel: React.FC<CrossReferencePanelProps> = ({
  bookId,
  bookName,
  chapter,
  verse,
  onNavigate,
  onClose,
  notes = [],
  topics = [],
  onEditNote,
  onDeleteNote,
  onCreateNote,
  showNotesPanel = false,
  onToggleNotesPanel,
}) => {
  const [crossRefs, setCrossRefs] = useState<CrossRefEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [verseTexts, setVerseTexts] = useState<Map<string, string>>(new Map());
  const [displayedRefs, setDisplayedRefs] = useState<VerseWithText[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('treasury');

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
    setSelectedVerses(new Set()); // Clear selections when changing topic
  };

  const handleRefClick = (ref: CrossReference) => {
    onNavigate(ref.bookId, ref.chapter, ref.verse);
  };

  const handleCopySelected = async () => {
    const selectedRefs = displayedRefs.filter(ref => selectedVerses.has(ref.refKey));
    if (selectedRefs.length === 0) return;

    const textToCopy = selectedRefs
      .map(ref => `${crossRefService.formatReference(ref)}\n${ref.text || ''}`)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const totalRefs = crossRefs.reduce((sum, entry) => sum + entry.refs.length, 0);

  // Filter notes for current verse
  const verseNotes = notes.filter(note =>
    note.verses?.some(v =>
      v.bookId === bookId &&
      v.chapter === chapter &&
      v.startVerse <= verse &&
      (v.endVerse || v.startVerse) >= verse
    )
  );

  const getTopicById = (id: string) => topics.find(t => t.id === id);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`cross-ref-panel-wrapper ${showNotesPanel ? 'with-notes' : ''}`}>
      <div className="cross-ref-panel">
        {/* Header */}
        <div className="cross-ref-header">
          <div className="cross-ref-header-top">
            <span className="cross-ref-label">CROSS REFERENCES</span>
            <button className="cross-ref-close" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2
            className="cross-ref-verse-title"
            onClick={() => onNavigate(bookId, chapter, verse)}
            title="Go to this verse"
          >
            {bookName} {chapter}:{verse}
          </h2>
        </div>

        {/* Tabs */}
        <div className="cross-ref-tabs">
          <button
            className={`cross-ref-tab ${activeTab === 'treasury' ? 'active' : ''}`}
            onClick={() => setActiveTab('treasury')}
          >
            Treasury of Scripture
            <span className="cross-ref-tab-count">{totalRefs}</span>
          </button>
          <button
            className={`cross-ref-tab ${activeTab === 'myRefs' ? 'active' : ''}`}
            onClick={() => setActiveTab('myRefs')}
          >
            My References
            <span className="cross-ref-tab-count">0</span>
          </button>
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
              {/* Filter by Phrase */}
              <div className="cross-ref-filter-section">
                <span className="cross-ref-filter-label">FILTER BY PHRASE</span>
                <div className="cross-ref-filters">
                  <button
                    className={`cross-ref-filter-btn ${selectedTopic === null ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedTopic(null);
                      // Show all refs when "All" is selected
                      const allRefsWithText: VerseWithText[] = [];
                      const seen = new Set<string>();
                      for (const entry of crossRefs) {
                        for (const ref of entry.refs) {
                          const key = `${ref.bookId}:${ref.chapter}:${ref.verse}`;
                          if (!seen.has(key)) {
                            seen.add(key);
                            allRefsWithText.push({
                              ...ref,
                              refKey: key,
                              text: verseTexts.get(key)
                            });
                          }
                        }
                      }
                      allRefsWithText.sort((a, b) => {
                        if (a.bookId !== b.bookId) return a.bookId - b.bookId;
                        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                        return a.verse - b.verse;
                      });
                      setDisplayedRefs(allRefsWithText);
                      setSelectedVerses(new Set());
                    }}
                  >
                    All
                  </button>
                  {crossRefs.map((entry, index) => (
                    <button
                      key={index}
                      className={`cross-ref-filter-btn ${selectedTopic === index ? 'active' : ''}`}
                      onClick={() => handleTopicClick(index)}
                    >
                      {entry.word || `Topic ${index + 1}`}
                      <span className="filter-count">{entry.refs.length}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Verses List */}
              <div className="cross-ref-verses-list">
                {displayedRefs.length === 0 ? (
                  <div className="cross-ref-empty-topic">
                    <p>Select a filter above to view scriptures</p>
                  </div>
                ) : (
                  displayedRefs.map((ref, index) => (
                    <div
                      key={index}
                      className={`cross-ref-verse-item ${selectedVerses.has(ref.refKey) ? 'selected' : ''}`}
                    >
                      <label
                        className="cross-ref-checkbox-wrapper"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedVerses.has(ref.refKey)}
                          onChange={(e) => {
                            setSelectedVerses(prev => {
                              const newSet = new Set(prev);
                              if (e.target.checked) {
                                newSet.add(ref.refKey);
                              } else {
                                newSet.delete(ref.refKey);
                              }
                              return newSet;
                            });
                          }}
                        />
                      </label>
                      <div
                        className="cross-ref-verse-content"
                        onClick={() => handleRefClick(ref)}
                      >
                        <div className="cross-ref-verse-ref">
                          {crossRefService.formatReference(ref)}
                        </div>
                        <div className="cross-ref-verse-text">
                          {ref.text || 'Loading...'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="cross-ref-footer">
          <span className="cross-ref-footer-hint">Click verses to select</span>
          <button
            className={`cross-ref-copy-btn ${copySuccess ? 'success' : ''}`}
            onClick={handleCopySelected}
            disabled={selectedVerses.size === 0}
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Notes Panel */}
      {showNotesPanel && (
        <div className="cross-ref-notes-panel">
          <div className="cross-ref-notes-header">
            <h3>Notes</h3>
            {onCreateNote && (
              <button
                className="cross-ref-notes-add"
                onClick={() => onCreateNote({
                  bookId,
                  bookName,
                  chapter,
                  startVerse: verse,
                  osisRef: `${bookName}.${chapter}.${verse}`,
                })}
                title="Add note for this verse"
              >
                +
              </button>
            )}
          </div>
          <div className="cross-ref-notes-content">
            {verseNotes.length === 0 ? (
              <div className="cross-ref-notes-empty">
                <p>No notes for this verse.</p>
                {onCreateNote && (
                  <button
                    className="cross-ref-notes-create-btn"
                    onClick={() => onCreateNote({
                      bookId,
                      bookName,
                      chapter,
                      startVerse: verse,
                      osisRef: `${bookName}.${chapter}.${verse}`,
                    })}
                  >
                    Create Note
                  </button>
                )}
              </div>
            ) : (
              <div className="cross-ref-notes-list">
                {verseNotes.map(note => (
                  <div
                    key={note.id}
                    className="cross-ref-note-item"
                    onClick={() => onEditNote?.(note)}
                  >
                    <div className="cross-ref-note-header">
                      <span className="cross-ref-note-title">
                        {note.title || 'Untitled Note'}
                      </span>
                      <span className="cross-ref-note-date">
                        {formatDate(note.updatedAt || note.timestamp)}
                      </span>
                    </div>
                    {note.topicIds && note.topicIds.length > 0 && (
                      <div className="cross-ref-note-topics">
                        {note.topicIds.map(topicId => {
                          const topic = getTopicById(topicId);
                          return topic ? (
                            <span
                              key={topicId}
                              className="cross-ref-note-topic"
                              style={{ backgroundColor: topic.color }}
                            >
                              {topic.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    <p className="cross-ref-note-preview">
                      {note.content.plainText.slice(0, 100)}
                      {note.content.plainText.length > 100 ? '...' : ''}
                    </p>
                    <div className="cross-ref-note-actions">
                      <button
                        className="cross-ref-note-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditNote?.(note);
                        }}
                        title="Edit note"
                      >
                        ✏️
                      </button>
                      {onDeleteNote && (
                        <button
                          className="cross-ref-note-action delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this note?')) {
                              onDeleteNote(note.id);
                            }
                          }}
                          title="Delete note"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossReferencePanel;
