import React, { useState } from 'react';
import { Note, Topic, VerseReference } from '../types/notes';
import './NotesPanel.css';

interface NotesPanelProps {
  notes: Note[];
  topics: Topic[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: () => void;
  onNavigateToVerse?: (verse: VerseReference) => void;
  onManageTopics: () => void;
}

const NotesPanel: React.FC<NotesPanelProps> = ({
  notes,
  topics,
  onEditNote,
  onDeleteNote,
  onCreateNote,
  onNavigateToVerse,
  onManageTopics,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopicId, setFilterTopicId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  const formatVerseRef = (ref: VerseReference): string => {
    if (ref.endVerse && ref.endVerse !== ref.startVerse) {
      return `${ref.bookName} ${ref.chapter}:${ref.startVerse}-${ref.endVerse}`;
    }
    return `${ref.bookName} ${ref.chapter}:${ref.startVerse}`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const getTopicById = (id: string): Topic | undefined => {
    return topics.find((t) => t.id === id);
  };

  // Filter and sort notes
  const filteredNotes = notes
    .filter((note) => {
      // Filter by topic
      if (filterTopicId && !note.topicIds?.includes(filterTopicId)) {
        return false;
      }
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title?.toLowerCase().includes(query);
        const matchesContent = note.content.plainText.toLowerCase().includes(query);
        const matchesVerse = note.verses?.some((v) =>
          formatVerseRef(v).toLowerCase().includes(query)
        );
        return matchesTitle || matchesContent || matchesVerse;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.updatedAt || b.timestamp) - (a.updatedAt || a.timestamp);
        case 'oldest':
          return (a.updatedAt || a.timestamp) - (b.updatedAt || b.timestamp);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

  const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="notes-panel">
      <div className="notes-panel-header">
        <h2>Notes</h2>
        <button className="notes-create-btn" onClick={onCreateNote}>
          + New Note
        </button>
      </div>

      <div className="notes-controls">
        <input
          type="text"
          className="notes-search"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="notes-filters">
          <select
            className="notes-filter-select"
            value={filterTopicId || ''}
            onChange={(e) => setFilterTopicId(e.target.value || null)}
          >
            <option value="">All Topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>

          <select
            className="notes-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">By Title</option>
          </select>

          <button className="notes-manage-topics-btn" onClick={onManageTopics}>
            Manage Topics
          </button>
        </div>
      </div>

      <div className="notes-list">
        {filteredNotes.length === 0 ? (
          <div className="notes-empty">
            {notes.length === 0 ? (
              <>
                <p>No notes yet</p>
                <span className="notes-empty-icon">📝</span>
                <button className="notes-create-first-btn" onClick={onCreateNote}>
                  Create your first note
                </button>
              </>
            ) : (
              <p>No notes match your search</p>
            )}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="note-card"
              onClick={() => onEditNote(note)}
            >
              <div className="note-card-header">
                {note.title && <h3 className="note-card-title">{note.title}</h3>}
                <span className="note-card-date">
                  {formatDate(note.updatedAt || note.timestamp)}
                </span>
              </div>

              {note.verses && note.verses.length > 0 && (
                <div className="note-card-verses">
                  {note.verses.map((verse, index) => (
                    <span
                      key={index}
                      className="note-verse-ref"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToVerse?.(verse);
                      }}
                    >
                      {formatVerseRef(verse)}
                    </span>
                  ))}
                </div>
              )}

              <p className="note-card-preview">
                {truncateText(note.content.plainText)}
              </p>

              {note.topicIds && note.topicIds.length > 0 && (
                <div className="note-card-topics">
                  {note.topicIds.map((topicId) => {
                    const topic = getTopicById(topicId);
                    if (!topic) return null;
                    return (
                      <span
                        key={topic.id}
                        className="note-topic-tag"
                        style={{ backgroundColor: topic.color || '#6b7280' }}
                      >
                        {topic.name}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="note-card-actions">
                <button
                  className="note-card-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditNote(note);
                  }}
                  title="Edit note"
                >
                  ✏️
                </button>
                <button
                  className="note-card-action delete"
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesPanel;
