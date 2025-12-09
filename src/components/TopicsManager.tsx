import React, { useState } from 'react';
import { Topic } from '../types/notes';
import './TopicsManager.css';

interface TopicsManagerProps {
  topics: Topic[];
  onAddTopic: (name: string, color?: string, description?: string) => void;
  onUpdateTopic: (id: string, updates: Partial<Omit<Topic, 'id' | 'timestamp'>>) => void;
  onDeleteTopic: (id: string) => void;
  onClose: () => void;
}

const TOPIC_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#6b7280', // gray
];

const TopicsManager: React.FC<TopicsManagerProps> = ({
  topics,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onClose,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: TOPIC_COLORS[0],
    description: '',
  });

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: '',
      color: TOPIC_COLORS[Math.floor(Math.random() * TOPIC_COLORS.length)],
      description: '',
    });
  };

  const handleStartEdit = (topic: Topic) => {
    setIsAdding(false);
    setEditingId(topic.id);
    setFormData({
      name: topic.name,
      color: topic.color || TOPIC_COLORS[0],
      description: topic.description || '',
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a topic name.');
      return;
    }

    if (isAdding) {
      onAddTopic(formData.name.trim(), formData.color, formData.description.trim() || undefined);
    } else if (editingId) {
      onUpdateTopic(editingId, {
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim() || undefined,
      });
    }

    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', color: TOPIC_COLORS[0], description: '' });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', color: TOPIC_COLORS[0], description: '' });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete topic "${name}"? Notes with this topic will keep their other topics.`)) {
      onDeleteTopic(id);
      if (editingId === id) {
        handleCancel();
      }
    }
  };

  return (
    <div className="topics-manager-overlay">
      <div className="topics-manager">
        <div className="topics-manager-header">
          <h2>Manage Topics</h2>
          <button className="topics-manager-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="topics-manager-body">
          {(isAdding || editingId) && (
            <div className="topic-form">
              <h3>{isAdding ? 'New Topic' : 'Edit Topic'}</h3>

              <div className="topic-form-field">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter topic name"
                  autoFocus
                />
              </div>

              <div className="topic-form-field">
                <label>Color</label>
                <div className="topic-color-grid">
                  {TOPIC_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`topic-color-option ${formData.color === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="topic-form-field">
                <label>Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this topic"
                  rows={2}
                />
              </div>

              <div className="topic-form-actions">
                <button className="topic-form-btn secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="topic-form-btn primary" onClick={handleSave}>
                  {isAdding ? 'Create Topic' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          <div className="topics-list-section">
            <div className="topics-list-header">
              <h3>Topics ({topics.length})</h3>
              {!isAdding && !editingId && (
                <button className="add-topic-btn" onClick={handleStartAdd}>
                  + Add Topic
                </button>
              )}
            </div>

            {topics.length === 0 ? (
              <div className="topics-empty">
                <p>No topics created yet</p>
                <p className="topics-empty-hint">
                  Topics help you organize your notes by theme
                </p>
              </div>
            ) : (
              <div className="topics-list">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className={`topic-item ${editingId === topic.id ? 'editing' : ''}`}
                  >
                    <div className="topic-item-main">
                      <span
                        className="topic-item-color"
                        style={{ backgroundColor: topic.color || '#6b7280' }}
                      />
                      <div className="topic-item-info">
                        <span className="topic-item-name">{topic.name}</span>
                        {topic.description && (
                          <span className="topic-item-desc">{topic.description}</span>
                        )}
                      </div>
                    </div>

                    <div className="topic-item-actions">
                      <button
                        className="topic-action-btn"
                        onClick={() => handleStartEdit(topic)}
                        title="Edit topic"
                      >
                        ✏️
                      </button>
                      <button
                        className="topic-action-btn delete"
                        onClick={() => handleDelete(topic.id, topic.name)}
                        title="Delete topic"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicsManager;
