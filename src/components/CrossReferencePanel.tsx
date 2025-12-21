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

  const handleSelectAll = () => {
    const allKeys = new Set(displayedRefs.map(ref => ref.refKey));
    setSelectedVerses(allKeys);
  };

  const handleUnselectAll = () => {
    setSelectedVerses(new Set());
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
  const allSelected = displayedRefs.length > 0 && selectedVerses.size === displayedRefs.length;

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
          <div className="cross-ref-header-actions">
            {onToggleNotesPanel && (
              <button
                className={`cross-ref-notes-toggle ${showNotesPanel ? 'active' : ''}`}
                onClick={onToggleNotesPanel}
                title={showNotesPanel ? 'Hide Notes' : 'Show Notes'}
              >
                <span className="notes-icon">📝</span>
                {verseNotes.length > 0 && (
                  <span className="notes-badge">{verseNotes.length}</span>
                )}
              </button>
            )}
            <button className="cross-ref-close" onClick={onClose}>×</button>
          </div>
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

              {/* Selection Controls */}
              {displayedRefs.length > 0 && (
                <div className="cross-ref-selection-controls">
                  <label className="cross-ref-select-all">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => e.target.checked ? handleSelectAll() : handleUnselectAll()}
                    />
                    <span>Select All</span>
                  </label>
                  <button
                    className="cross-ref-unselect-btn"
                    onClick={handleUnselectAll}
                    disabled={selectedVerses.size === 0}
                  >
                    Unselect All
                  </button>
                  <button
                    className={`cross-ref-copy-btn ${copySuccess ? 'success' : ''}`}
                    onClick={handleCopySelected}
                    disabled={selectedVerses.size === 0}
                  >
                    {copySuccess ? 'Copied!' : `Copy (${selectedVerses.size})`}
                  </button>
                </div>
              )}

              <div className="cross-ref-verses-list">
                {displayedRefs.length === 0 ? (
                  <div className="cross-ref-empty-topic">
                    <p>Select a topic above to view scriptures</p>
                  </div>
                ) : (
                  displayedRefs.map((ref, index) => (
                    <div
                      key={index}
                      className={`cross-ref-verse-item ${selectedVerses.has(ref.refKey) ? 'selected' : ''}`}
                      onClick={() => handleRefClick(ref)}
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
                      <div className="cross-ref-verse-content">
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
            </div>
          </>
        )}
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
