import React, { useState, useMemo } from 'react';
import './MemoryAnalytics.css';

interface UserMemories {
  user_id: string;
  traits: Record<string, any>;
  dream_patterns: {
    symbols: Record<string, any>;
    themes: Record<string, any>;
    emotions: Record<string, any>;
  };
  personal_context: {
    life_events: Array<any>;
    goals: Array<any>;
  };
  memories: Array<any>;
  created_at: string;
  last_updated: string;
}

interface MemoryAnalyticsProps {
  userMemories: UserMemories;
  onCleanup: (daysToKeep: number) => void;
}

export const MemoryAnalytics: React.FC<MemoryAnalyticsProps> = ({
  userMemories,
  onCleanup
}) => {
  const [cleanupDays, setCleanupDays] = useState(90);
  const [showCleanupModal, setShowCleanupModal] = useState(false);

  const analytics = useMemo(() => {
    const totalMemories = userMemories.memories.length;
    const totalTraits = Object.keys(userMemories.traits).length;
    const totalPatterns = Object.keys(userMemories.dream_patterns.symbols).length +
                         Object.keys(userMemories.dream_patterns.themes).length +
                         Object.keys(userMemories.dream_patterns.emotions).length;
    const totalContext = userMemories.personal_context.life_events.length +
                        userMemories.personal_context.goals.length;

    // Memory growth over time
    const memoryGrowth = userMemories.memories
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((memory, index) => ({
        date: memory.created_at,
        count: index + 1
      }));

    // Most important memories
    const importantMemories = userMemories.memories
      .filter(m => m.importance === 'high')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Pattern frequency analysis
    const allPatterns = [
      ...Object.entries(userMemories.dream_patterns.symbols).map(([name, data]) => ({ name, ...data, type: 'symbol' })),
      ...Object.entries(userMemories.dream_patterns.themes).map(([name, data]) => ({ name, ...data, type: 'theme' })),
      ...Object.entries(userMemories.dream_patterns.emotions).map(([name, data]) => ({ name, ...data, type: 'emotion' }))
    ];

    const topPatterns = allPatterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Memory type distribution
    const memoryTypeDistribution = userMemories.memories.reduce((acc, memory) => {
      acc[memory.type] = (acc[memory.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Importance distribution
    const importanceDistribution = userMemories.memories.reduce((acc, memory) => {
      acc[memory.importance] = (acc[memory.importance] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMemories = userMemories.memories.filter(memory => 
      new Date(memory.created_at) > thirtyDaysAgo
    );

    return {
      totalMemories,
      totalTraits,
      totalPatterns,
      totalContext,
      memoryGrowth,
      importantMemories,
      topPatterns,
      memoryTypeDistribution,
      importanceDistribution,
      recentMemories
    };
  }, [userMemories]);

  const handleCleanup = async () => {
    try {
      await onCleanup(cleanupDays);
      setShowCleanupModal(false);
    } catch (error) {
      console.error('Error cleaning up memories:', error);
    }
  };

  const getMemoryTypeColor = (type: string) => {
    switch (type) {
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
  };

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

  return (
    <div className="memory-analytics">
      <div className="analytics-header">
        <h3>Memory Analytics</h3>
        <div className="analytics-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowCleanupModal(true)}
          >
            🧹 Cleanup Memories
          </button>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Overview Stats */}
        <div className="analytics-section overview-stats">
          <h4>Overview</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">🧠</div>
              <div className="stat-content">
                <div className="stat-number">{analytics.totalMemories}</div>
                <div className="stat-label">Total Memories</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">👤</div>
              <div className="stat-content">
                <div className="stat-number">{analytics.totalTraits}</div>
                <div className="stat-label">User Traits</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🔍</div>
              <div className="stat-content">
                <div className="stat-number">{analytics.totalPatterns}</div>
                <div className="stat-label">Dream Patterns</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <div className="stat-number">{analytics.totalContext}</div>
                <div className="stat-label">Context Items</div>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Type Distribution */}
        <div className="analytics-section memory-types">
          <h4>Memory Types</h4>
          <div className="distribution-chart">
            {Object.entries(analytics.memoryTypeDistribution).map(([type, count]) => (
              <div key={type} className="distribution-item">
                <div className="distribution-label">
                  <span className="type-icon" style={{ color: getMemoryTypeColor(type) }}>
                    {type === 'dream_insight' ? '🧠' : 
                     type === 'conversation' ? '💬' : 
                     type === 'observation' ? '👁️' : '⭐'}
                  </span>
                  {type.replace('_', ' ')}
                </div>
                <div className="distribution-bar">
                  <div
                    className="distribution-fill"
                    style={{
                      width: `${((count as number) / analytics.totalMemories) * 100}%`,
                      backgroundColor: getMemoryTypeColor(type)
                    }}
                  />
                </div>
                <div className="distribution-count">{count as number}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Importance Distribution */}
        <div className="analytics-section importance-distribution">
          <h4>Importance Levels</h4>
          <div className="distribution-chart">
            {Object.entries(analytics.importanceDistribution).map(([importance, count]) => (
              <div key={importance} className="distribution-item">
                <div className="distribution-label">
                  <span className="importance-icon" style={{ color: getImportanceColor(importance) }}>
                    {importance === 'high' ? '🔴' : importance === 'medium' ? '🟡' : '🟢'}
                  </span>
                  {importance} importance
                </div>
                <div className="distribution-bar">
                  <div
                    className="distribution-fill"
                    style={{
                      width: `${((count as number) / analytics.totalMemories) * 100}%`,
                      backgroundColor: getImportanceColor(importance)
                    }}
                  />
                </div>
                <div className="distribution-count">{count as number}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Patterns */}
        <div className="analytics-section top-patterns">
          <h4>Most Frequent Patterns</h4>
          <div className="patterns-list">
            {analytics.topPatterns.map((pattern, index) => (
              <div key={`${pattern.type}-${pattern.name}`} className="pattern-item">
                <div className="pattern-rank">#{index + 1}</div>
                <div className="pattern-info">
                  <div className="pattern-name">{pattern.name}</div>
                  <div className="pattern-type">{pattern.type}</div>
                </div>
                <div className="pattern-frequency">{pattern.frequency}x</div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Memories */}
        <div className="analytics-section important-memories">
          <h4>Most Important Memories</h4>
          <div className="memories-list">
            {analytics.importantMemories.map((memory) => (
              <div key={memory.id} className="memory-item">
                <div className="memory-content">
                  {memory.content.length > 100 
                    ? `${memory.content.substring(0, 100)}...` 
                    : memory.content
                  }
                </div>
                <div className="memory-meta">
                  <span className="memory-type">{memory.type}</span>
                  <span className="memory-date">
                    {new Date(memory.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="analytics-section recent-activity">
          <h4>Recent Activity (Last 30 Days)</h4>
          <div className="activity-stats">
            <div className="activity-item">
              <div className="activity-icon">📈</div>
              <div className="activity-content">
                <div className="activity-number">{analytics.recentMemories.length}</div>
                <div className="activity-label">New Memories</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📅</div>
              <div className="activity-content">
                <div className="activity-number">
                  {analytics.recentMemories.length > 0 
                    ? Math.ceil(analytics.recentMemories.length / 30 * 7)
                    : 0
                  }
                </div>
                <div className="activity-label">Per Week</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cleanup Modal */}
      {showCleanupModal && (
        <div className="cleanup-modal-overlay">
          <div className="cleanup-modal">
            <div className="modal-header">
              <h4>Cleanup Memories</h4>
              <button
                className="close-btn"
                onClick={() => setShowCleanupModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <p>Remove old, low-importance memories to keep the system optimized.</p>
              <div className="cleanup-controls">
                <label>
                  Keep memories from the last:
                  <select
                    value={cleanupDays}
                    onChange={(e) => setCleanupDays(parseInt(e.target.value))}
                    className="form-select"
                  >
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCleanupModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCleanup}
              >
                Cleanup Memories
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
