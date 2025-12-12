import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import { Note, Topic, VerseReference, RichTextContent } from '../types/notes';
import './NoteEditor.css';

interface NoteEditorProps {
  note?: Note;
  verses?: VerseReference[];
  topics: Topic[];
  onSave: (
    content: RichTextContent,
    verses?: VerseReference[],
    topicIds?: string[],
    title?: string
  ) => void;
  onCancel: () => void;
  onDelete?: () => void;
  mode?: 'modal' | 'panel';
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  verses: initialVerses,
  topics,
  onSave,
  onCancel,
  onDelete,
  mode = 'modal',
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState<RichTextContent>(
    note?.content || { html: '', plainText: '' }
  );
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    note?.topicIds || []
  );
  const [attachedVerses, setAttachedVerses] = useState<VerseReference[]>(
    note?.verses || initialVerses || []
  );
  const [showTopicSelector, setShowTopicSelector] = useState(false);

  const isEditing = !!note;

  const handleSave = () => {
    if (!content.plainText.trim() && !title.trim()) {
      alert('Please add a title or content to your note.');
      return;
    }
    onSave(
      content,
      attachedVerses.length > 0 ? attachedVerses : undefined,
      selectedTopicIds.length > 0 ? selectedTopicIds : undefined,
      title.trim() || undefined
    );
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const removeVerse = (index: number) => {
    setAttachedVerses((prev) => prev.filter((_, i) => i !== index));
  };

  const formatVerseRef = (ref: VerseReference): string => {
    if (ref.endVerse && ref.endVerse !== ref.startVerse) {
      return `${ref.bookName} ${ref.chapter}:${ref.startVerse}-${ref.endVerse}`;
    }
    return `${ref.bookName} ${ref.chapter}:${ref.startVerse}`;
  };

  const editorContent = (
    <>
      <div className="note-editor-header">
        <h2>{isEditing ? 'Edit Note' : 'New Note'}</h2>
        <button className="note-editor-close" onClick={onCancel}>
          ×
        </button>
      </div>

      <div className="note-editor-body">
        <div className="note-editor-field">
          <input
            type="text"
            className="note-title-input"
            placeholder="Note title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {attachedVerses.length > 0 && (
          <div className="note-attached-verses">
            <label>Attached to:</label>
            <div className="verse-tags">
              {attachedVerses.map((verse, index) => (
                <span key={index} className="verse-tag">
                  {formatVerseRef(verse)}
                  <button
                    className="verse-tag-remove"
                    onClick={() => removeVerse(index)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="note-editor-field">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your note here..."
            autoFocus
          />
        </div>

        <div className="note-topics-section">
          <button
            className="topics-toggle"
            onClick={() => setShowTopicSelector(!showTopicSelector)}
          >
            <span>Topics</span>
            {selectedTopicIds.length > 0 && (
              <span className="topics-count">{selectedTopicIds.length}</span>
            )}
            <span className="topics-arrow">{showTopicSelector ? '▲' : '▼'}</span>
          </button>

          {showTopicSelector && (
            <div className="topics-selector">
              {topics.length === 0 ? (
                <p className="topics-empty">No topics created yet</p>
              ) : (
                topics.map((topic) => (
                  <label key={topic.id} className="topic-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTopicIds.includes(topic.id)}
                      onChange={() => toggleTopic(topic.id)}
                    />
                    <span
                      className="topic-color"
                      style={{ backgroundColor: topic.color || '#6b7280' }}
                    />
                    <span className="topic-name">{topic.name}</span>
                  </label>
                ))
              )}
            </div>
          )}

          {selectedTopicIds.length > 0 && (
            <div className="selected-topics">
              {selectedTopicIds.map((topicId) => {
                const topic = topics.find((t) => t.id === topicId);
                if (!topic) return null;
                return (
                  <span
                    key={topic.id}
                    className="selected-topic-tag"
                    style={{ backgroundColor: topic.color || '#6b7280' }}
                  >
                    {topic.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="note-editor-footer">
        {isEditing && onDelete && (
          <button
            className="note-btn note-btn-delete"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this note?')) {
                onDelete();
              }
            }}
          >
            Delete
          </button>
        )}
        <div className="note-editor-actions">
          <button className="note-btn note-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="note-btn note-btn-primary" onClick={handleSave}>
            {isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );

  if (mode === 'panel') {
    return (
      <div className="note-editor-panel">
        <div className="note-editor note-editor-panel-content">
          {editorContent}
        </div>
      </div>
    );
  }

  return (
    <div className="note-editor-overlay">
      <div className="note-editor">
        {editorContent}
      </div>
    </div>
  );
};

export default NoteEditor;
