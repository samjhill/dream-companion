import React, { useState, useMemo } from 'react';
import './MemoryTimeline.css';

interface Memory {
  id: string;
  content: string;
  type: string;
  importance: string;
  tags: string[];
  created_at: string;
}

interface MemoryTimelineProps {
  memories: Memory[];
  groupBy: 'type' | 'importance' | 'source';
}

export const MemoryTimeline: React.FC<MemoryTimelineProps> = ({
  memories,
  groupBy
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const groupedMemories = useMemo(() => {
    const groups: Record<string, Memory[]> = {};
    
    memories.forEach(memory => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'type':
          groupKey = memory.type;
          break;
        case 'importance':
          groupKey = memory.importance;
          break;
        case 'source':
          groupKey = memory.type; // Using type as source for now
          break;
        default:
          groupKey = 'all';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(memory);
    });
    
    // Sort memories within each group by creation date (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });
    
    return groups;
  }, [memories, groupBy]);

  const getGroupIcon = (groupKey: string) => {
    switch (groupBy) {
      case 'type':
        switch (groupKey) {
          case 'dream_insight':
            return '🧠';
          case 'conversation':
            return '💬';
          case 'observation':
            return '👁️';
          case 'preference':
            return '⭐';
          default:
            return '📝';
        }
      case 'importance':
        switch (groupKey) {
          case 'high':
            return '🔴';
          case 'medium':
            return '🟡';
          case 'low':
            return '🟢';
          default:
            return '⚪';
        }
      case 'source':
        return '📊';
      default:
        return '📄';
    }
  };

  const getGroupColor = (groupKey: string) => {
    switch (groupBy) {
      case 'type':
        switch (groupKey) {
          case 'dream_insight':
            return '#667eea';
          case 'conversation':
            return '#764ba2';
          case 'observation':
            return '#f093fb';
          case 'preference':
            return '#4ade80';
          default:
            return '#666';
        }
      case 'importance':
        switch (groupKey) {
          case 'high':
            return '#ff4444';
          case 'medium':
            return '#ffaa00';
          case 'low':
            return '#44ff44';
          default:
            return '#666';
        }
      case 'source':
        return '#667eea';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  if (memories.length === 0) {
    return (
      <div className="memory-timeline">
        <div className="empty-timeline">
          <div className="empty-icon">📅</div>
          <p>No memories found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-timeline">
      <div className="timeline-header">
        <h4>Memory Timeline</h4>
        <div className="timeline-controls">
          <span className="group-label">Group by: {groupBy}</span>
          <div className="group-filters">
            {Object.keys(groupedMemories).map(groupKey => (
              <button
                key={groupKey}
                className={`group-filter ${selectedGroup === groupKey ? 'active' : ''}`}
                onClick={() => setSelectedGroup(selectedGroup === groupKey ? null : groupKey)}
                style={{ borderColor: getGroupColor(groupKey) }}
              >
                <span className="group-icon">{getGroupIcon(groupKey)}</span>
                <span className="group-name">{groupKey}</span>
                <span className="group-count">({groupedMemories[groupKey].length})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="timeline-content">
        {Object.entries(groupedMemories).map(([groupKey, groupMemories]) => {
          if (selectedGroup && selectedGroup !== groupKey) return null;
          
          return (
            <div key={groupKey} className="timeline-group">
              <div className="group-header">
                <div className="group-title">
                  <span className="group-icon">{getGroupIcon(groupKey)}</span>
                  <span className="group-name">{groupKey}</span>
                  <span className="group-count">({groupMemories.length})</span>
                </div>
                <div className="group-bar" style={{ backgroundColor: getGroupColor(groupKey) }} />
              </div>
              
              <div className="group-memories">
                {groupMemories.map((memory) => (
                  <div key={memory.id} className="timeline-item">
                    <div className="timeline-marker" style={{ backgroundColor: getGroupColor(groupKey) }} />
                    <div className="timeline-content-item">
                      <div className="memory-header">
                        <div className="memory-type">{memory.type}</div>
                        <div className="memory-date">{formatDate(memory.created_at)}</div>
                      </div>
                      <div className="memory-content">
                        {truncateContent(memory.content)}
                      </div>
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="memory-tags">
                          {memory.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="memory-importance">
                        <span className={`importance-badge ${memory.importance}`}>
                          {memory.importance} importance
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
