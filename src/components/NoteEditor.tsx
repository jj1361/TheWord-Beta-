import React, { useState, useRef, useCallback, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import { Note, Topic, VerseReference, RichTextContent } from '../types/notes';
import './NoteEditor.css';

const MIN_HEIGHT = 200;
const MAX_HEIGHT_PERCENT = 80; // Max 80% of viewport height
const DEFAULT_HEIGHT = 350;

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
  mode?: 'modal' | 'panel' | 'integrated' | 'bottom';
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isWideView?: boolean;
  onToggleWideView?: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  verses: initialVerses,
  topics,
  onSave,
  onCancel,
  onDelete,
  mode = 'modal',
  isFullscreen = false,
  onToggleFullscreen,
  isWideView = false,
  onToggleWideView,
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

  // Draggable resize state for bottom panel
  const [panelHeight, setPanelHeight] = useState(() => {
    const saved = localStorage.getItem('noteEditorHeight');
    return saved ? parseInt(saved, 10) : DEFAULT_HEIGHT;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    dragStartHeight.current = panelHeight;
  }, [panelHeight]);

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = dragStartY.current - clientY;
      const maxHeight = window.innerHeight * (MAX_HEIGHT_PERCENT / 100);
      const newHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, dragStartHeight.current + deltaY));
      setPanelHeight(newHeight);
    };

    const handleEnd = () => {
      setIsDragging(false);
      localStorage.setItem('noteEditorHeight', panelHeight.toString());
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, panelHeight]);

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
        <input
          type="text"
          className="note-title-input"
          placeholder={isEditing ? 'Edit Note' : 'New Note'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="note-editor-header-actions">
          {isEditing && onDelete && (
            <button
              className="note-header-btn note-header-btn-delete"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this note?')) {
                  onDelete();
                }
              }}
              title="Delete note"
            >
              Delete
            </button>
          )}
          <button className="note-header-btn note-header-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="note-header-btn note-header-btn-primary" onClick={handleSave}>
            {isEditing ? 'Update' : 'Save'}
          </button>
          {onToggleWideView && (
            <button
              className="note-editor-view-btn"
              onClick={onToggleWideView}
              title={isWideView ? 'Normal view' : 'Wide view (match chapter width)'}
            >
              {isWideView ? '⊏⊐' : '⊐⊏'}
            </button>
          )}
          {onToggleFullscreen && (
            <button
              className="note-editor-fullscreen-btn"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
            >
              {isFullscreen ? '⊡' : '⛶'}
            </button>
          )}
          <button className="note-editor-close" onClick={onCancel}>
            ×
          </button>
        </div>
      </div>

      <div className="note-editor-body">

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
    </>
  );

  if (mode === 'bottom') {
    return (
      <div
        className={`note-editor-bottom ${isFullscreen ? 'fullscreen' : ''} ${isWideView ? 'wide-view' : ''} ${isDragging ? 'dragging' : ''}`}
        style={!isFullscreen ? { height: `${panelHeight}px` } : undefined}
      >
        {/* Drag handle at top */}
        <div
          className="note-editor-drag-handle"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          title="Drag to resize"
        >
          <div className="drag-handle-bar" />
        </div>
        <div className="note-editor note-editor-bottom-content">
          {editorContent}
        </div>
      </div>
    );
  }

  if (mode === 'integrated') {
    return (
      <div className={`note-editor-integrated ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="note-editor note-editor-integrated-content">
          {editorContent}
        </div>
      </div>
    );
  }

  if (mode === 'panel') {
    return (
      <div className={`note-editor-panel ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="note-editor note-editor-panel-content">
          {editorContent}
        </div>
      </div>
    );
  }

  return (
    <div className="note-editor-overlay">
      <div className={`note-editor ${isFullscreen ? 'fullscreen' : ''}`}>
        {editorContent}
      </div>
    </div>
  );
};

export default NoteEditor;
