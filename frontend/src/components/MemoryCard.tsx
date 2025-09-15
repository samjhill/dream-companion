import React, { useState } from 'react';
import { format } from 'date-fns';

interface MemoryCardProps {
  type: 'memory' | 'trait' | 'context';
  data: any;
  onEdit: (data: any) => void;
  onDelete: () => void;
  importance: 'low' | 'medium' | 'high';
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  type,
  data,
  onEdit,
  onDelete,
  importance
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#4ecdc4';
      case 'low': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'memory': return '📝';
      case 'trait': return '🎭';
      case 'context': return '📅';
      default: return '📄';
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  if (isEditing) {
    return (
      <div className="memory-card editing">
        <div className="card-header">
          <span className="type-icon">{getTypeIcon(type)}</span>
          <span className="card-type">Editing {type}</span>
        </div>
        
        <div className="edit-form">
          {type === 'memory' && (
            <>
              <textarea
                value={editData.content || ''}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                placeholder="Memory content..."
                className="edit-textarea"
              />
              <select
                value={editData.type || ''}
                onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                className="edit-select"
              >
                <option value="observation">Observation</option>
                <option value="insight">Insight</option>
                <option value="experience">Experience</option>
                <option value="reflection">Reflection</option>
              </select>
              <select
                value={editData.importance || 'medium'}
                onChange={(e) => setEditData({ ...editData, importance: e.target.value })}
                className="edit-select"
              >
                <option value="low">Low Importance</option>
                <option value="medium">Medium Importance</option>
                <option value="high">High Importance</option>
              </select>
            </>
          )}
          
          {type === 'trait' && (
            <>
              <input
                type="text"
                value={editData.key || ''}
                onChange={(e) => setEditData({ ...editData, key: e.target.value })}
                placeholder="Trait name (e.g., 'Optimistic')"
                className="edit-input"
              />
              <textarea
                value={editData.value || ''}
                onChange={(e) => setEditData({ ...editData, value: e.target.value })}
                placeholder="Trait description..."
                className="edit-textarea"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={editData.confidence || 0.5}
                onChange={(e) => setEditData({ ...editData, confidence: parseFloat(e.target.value) })}
                className="edit-range"
              />
              <span className="confidence-label">
                Confidence: {Math.round((editData.confidence || 0.5) * 100)}%
              </span>
            </>
          )}
          
          {type === 'context' && (
            <>
              <textarea
                value={editData.value || ''}
                onChange={(e) => setEditData({ ...editData, value: e.target.value })}
                placeholder="Context description..."
                className="edit-textarea"
              />
              <select
                value={editData.importance || 'medium'}
                onChange={(e) => setEditData({ ...editData, importance: e.target.value })}
                className="edit-select"
              >
                <option value="low">Low Importance</option>
                <option value="medium">Medium Importance</option>
                <option value="high">High Importance</option>
              </select>
            </>
          )}
        </div>
        
        <div className="card-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-card">
      <div className="card-header">
        <span className="type-icon">{getTypeIcon(type)}</span>
        <span className="card-type">{type}</span>
        <div 
          className="importance-indicator"
          style={{ backgroundColor: getImportanceColor(importance) }}
        />
      </div>
      
      <div className="card-content">
        {type === 'memory' && (
          <>
            <p className="memory-content">{data.content}</p>
            <div className="memory-meta">
              <span className="memory-type">{data.type}</span>
              <span className="memory-date">{formatDate(data.created_at)}</span>
            </div>
          </>
        )}
        
        {type === 'trait' && (
          <>
            <h4 className="trait-name">{data.key}</h4>
            <p className="trait-description">{data.value}</p>
            <div className="trait-meta">
              <span className="confidence">
                Confidence: {Math.round((data.confidence || 0.5) * 100)}%
              </span>
              <span className="trait-date">{formatDate(data.updated_at)}</span>
            </div>
          </>
        )}
        
        {type === 'context' && (
          <>
            <p className="context-content">{data.value}</p>
            <div className="context-meta">
              <span className="context-source">Source: {data.source}</span>
              <span className="context-date">{formatDate(data.created_at)}</span>
            </div>
          </>
        )}
      </div>
      
      <div className="card-actions">
        <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <button className="btn btn-sm btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};