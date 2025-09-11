import React, { useState } from 'react';
import './MemoryCard.css';

interface MemoryCardProps {
  type: 'trait' | 'pattern' | 'context' | 'memory';
  data: any;
  onEdit: (data: any) => void;
  onDelete: (id: string) => void;
  importance: 'low' | 'medium' | 'high';
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  type,
  data,
  onEdit,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return '#ff4444';
      case 'medium':
        return '#ffaa00';
      case 'low':
        return '#44ff44';
      default:
        return '#666';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trait':
        return '👤';
      case 'pattern':
        return '🔍';
      case 'context':
        return '📝';
      case 'memory':
        return '🧠';
      default:
        return '📄';
    }
  };

  const handleSave = () => {
    onEdit(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const renderTraitCard = () => (
    <div className="memory-card trait-card">
      <div className="card-header">
        <div className="card-type">
          <span className="type-icon">{getTypeIcon(type)}</span>
          <span className="type-label">Trait</span>
        </div>
        <div className="card-actions">
          <button className="btn-icon" onClick={() => setIsEditing(true)}>
            ✏️
          </button>
          <button className="btn-icon" onClick={() => onDelete(data.key || data.id)}>
            🗑️
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="edit-form">
          <input
            type="text"
            value={editData.key || ''}
            onChange={(e) => setEditData({ ...editData, key: e.target.value })}
            placeholder="Trait name"
            className="form-input"
          />
          <input
            type="text"
            value={editData.value || ''}
            onChange={(e) => setEditData({ ...editData, value: e.target.value })}
            placeholder="Trait value"
            className="form-input"
          />
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={editData.confidence || 0}
            onChange={(e) => setEditData({ ...editData, confidence: parseFloat(e.target.value) })}
            placeholder="Confidence (0-1)"
            className="form-input"
          />
          <div className="edit-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="card-content">
          <div className="trait-name">{data.key}</div>
          <div className="trait-value">{data.value}</div>
          <div className="trait-confidence">
            Confidence: {(data.confidence * 100).toFixed(0)}%
          </div>
          <div className="trait-updated">
            Updated: {new Date(data.updated_at).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );

  const renderPatternCard = () => (
    <div className="memory-card pattern-card">
      <div className="card-header">
        <div className="card-type">
          <span className="type-icon">{getTypeIcon(type)}</span>
          <span className="type-label">Pattern</span>
        </div>
        <div className="pattern-frequency">
          {data.frequency}x
        </div>
      </div>
      
      <div className="card-content">
        <div className="pattern-name">{data.key || data.name}</div>
        <div className="pattern-dates">
          <div>First seen: {new Date(data.first_seen).toLocaleDateString()}</div>
          <div>Last seen: {new Date(data.last_seen).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );

  const renderContextCard = () => (
    <div className="memory-card context-card">
      <div className="card-header">
        <div className="card-type">
          <span className="type-icon">{getTypeIcon(type)}</span>
          <span className="type-label">Context</span>
        </div>
        <div className="card-actions">
          <button className="btn-icon" onClick={() => setIsEditing(true)}>
            ✏️
          </button>
          <button className="btn-icon" onClick={() => onDelete(data.id)}>
            🗑️
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="edit-form">
          <textarea
            value={editData.value || ''}
            onChange={(e) => setEditData({ ...editData, value: e.target.value })}
            placeholder="Context value"
            className="form-textarea"
            rows={3}
          />
          <select
            value={editData.importance || 'medium'}
            onChange={(e) => setEditData({ ...editData, importance: e.target.value })}
            className="form-select"
          >
            <option value="low">Low Importance</option>
            <option value="medium">Medium Importance</option>
            <option value="high">High Importance</option>
          </select>
          <div className="edit-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="card-content">
          <div className="context-value">{data.value}</div>
          <div className="context-meta">
            <div className="context-importance" style={{ color: getImportanceColor(data.importance) }}>
              {data.importance} importance
            </div>
            <div className="context-source">Source: {data.source}</div>
            <div className="context-created">
              Created: {new Date(data.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMemoryCard = () => (
    <div className="memory-card memory-card-item">
      <div className="card-header">
        <div className="card-type">
          <span className="type-icon">{getTypeIcon(type)}</span>
          <span className="type-label">Memory</span>
        </div>
        <div className="card-actions">
          <button className="btn-icon" onClick={() => setIsEditing(true)}>
            ✏️
          </button>
          <button className="btn-icon" onClick={() => onDelete(data.id)}>
            🗑️
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="edit-form">
          <textarea
            value={editData.content || ''}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            placeholder="Memory content"
            className="form-textarea"
            rows={4}
          />
          <select
            value={editData.type || 'dream_insight'}
            onChange={(e) => setEditData({ ...editData, type: e.target.value })}
            className="form-select"
          >
            <option value="dream_insight">Dream Insight</option>
            <option value="conversation">Conversation</option>
            <option value="observation">Observation</option>
            <option value="preference">Preference</option>
          </select>
          <select
            value={editData.importance || 'medium'}
            onChange={(e) => setEditData({ ...editData, importance: e.target.value })}
            className="form-select"
          >
            <option value="low">Low Importance</option>
            <option value="medium">Medium Importance</option>
            <option value="high">High Importance</option>
          </select>
          <input
            type="text"
            value={editData.tags ? editData.tags.join(', ') : ''}
            onChange={(e) => setEditData({ ...editData, tags: e.target.value.split(',').map(t => t.trim()) })}
            placeholder="Tags (comma-separated)"
            className="form-input"
          />
          <div className="edit-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="card-content">
          <div className="memory-content">{data.content}</div>
          <div className="memory-meta">
            <div className="memory-type">Type: {data.type}</div>
            <div className="memory-importance" style={{ color: getImportanceColor(data.importance) }}>
              {data.importance} importance
            </div>
            <div className="memory-tags">
              {data.tags && data.tags.map((tag: string, index: number) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
            <div className="memory-created">
              Created: {new Date(data.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCard = () => {
    switch (type) {
      case 'trait':
        return renderTraitCard();
      case 'pattern':
        return renderPatternCard();
      case 'context':
        return renderContextCard();
      case 'memory':
        return renderMemoryCard();
      default:
        return null;
    }
  };

  return renderCard();
};
