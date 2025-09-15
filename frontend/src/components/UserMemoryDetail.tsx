import React, { useState, useEffect } from 'react';
import { MemoryAPI } from '../services/MemoryAPI';
import { MemoryCard } from './MemoryCard';
import { AddMemoryForm } from './AddMemoryForm';
import { PatternChart } from './PatternChart';
import { MemoryAnalytics } from './MemoryAnalytics';
import './UserMemoryDetail.css';

interface UserMemories {
  user_id: string;
  traits: Record<string, {
    value: string;
    confidence: number;
    updated_at: string;
  }>;
  dream_patterns: {
    symbols: Record<string, {
      frequency: number;
      first_seen: string;
      last_seen: string;
    }>;
    themes: Record<string, {
      frequency: number;
      first_seen: string;
      last_seen: string;
    }>;
    emotions: Record<string, {
      frequency: number;
      first_seen: string;
      last_seen: string;
    }>;
  };
  personal_context: {
    life_events: Array<{
      id: string;
      value: string;
      importance: string;
      source: string;
      created_at: string;
    }>;
    goals: Array<{
      id: string;
      value: string;
      importance: string;
      source: string;
      created_at: string;
    }>;
  };
  memories: Array<{
    id: string;
    content: string;
    type: string;
    importance: string;
    tags: string[];
    created_at: string;
  }>;
  created_at: string;
  last_updated: string;
}

interface UserMemoryDetailProps {
  userId: string;
  onBack?: () => void;
}

export const UserMemoryDetail: React.FC<UserMemoryDetailProps> = ({
  userId,
  onBack
}) => {
  const [userMemories, setUserMemories] = useState<UserMemories | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'traits' | 'patterns' | 'context' | 'memories' | 'analytics' | 'summary'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    loadUserMemories();
  }, [userId]);

  const loadUserMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await MemoryAPI.getUserMemories(userId);
      setUserMemories(response);
    } catch (err) {
      setError('Failed to load user memories');
      console.error('Error loading user memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAiSummary = async () => {
    try {
      setSummaryLoading(true);
      const response = await MemoryAPI.getUserMemorySummary(userId);
      setAiSummary(response.summary);
    } catch (err) {
      console.error('Error loading AI summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleAddTrait = async (traitData: any) => {
    try {
      setError(null);
      await MemoryAPI.addTrait(userId, traitData);
      await loadUserMemories();
    } catch (err) {
      console.error('Error adding trait:', err);
      setError(`Failed to add trait: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAddMemory = async (memoryData: any) => {
    try {
      setError(null);
      await MemoryAPI.addMemory(userId, memoryData);
      await loadUserMemories();
    } catch (err) {
      console.error('Error adding memory:', err);
      setError(`Failed to add memory: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAddContext = async (contextData: any) => {
    try {
      setError(null);
      await MemoryAPI.addContext(userId, contextData);
      await loadUserMemories();
    } catch (err) {
      console.error('Error adding context:', err);
      setError(`Failed to add context: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateTrait = async (traitType: string, traitData: any) => {
    try {
      setError(null);
      await MemoryAPI.updateTrait(userId, traitType, traitData);
      await loadUserMemories();
    } catch (err) {
      console.error('Error updating trait:', err);
      setError(`Failed to update trait: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateMemory = async (memoryId: string, memoryData: any) => {
    try {
      setError(null);
      await MemoryAPI.updateMemory(userId, memoryId, memoryData);
      await loadUserMemories();
    } catch (err) {
      console.error('Error updating memory:', err);
      setError(`Failed to update memory: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateContext = async (contextId: string, contextData: any) => {
    try {
      setError(null);
      await MemoryAPI.updateContext(userId, contextId, contextData);
      await loadUserMemories();
    } catch (err) {
      console.error('Error updating context:', err);
      setError(`Failed to update context: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteTrait = async (traitType: string) => {
    try {
      setError(null);
      await MemoryAPI.deleteTrait(userId, traitType);
      await loadUserMemories();
    } catch (err) {
      console.error('Error deleting trait:', err);
      setError(`Failed to delete trait: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      setError(null);
      await MemoryAPI.deleteMemory(userId, memoryId);
      await loadUserMemories();
    } catch (err) {
      console.error('Error deleting memory:', err);
      setError(`Failed to delete memory: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteContext = async (contextId: string) => {
    try {
      setError(null);
      await MemoryAPI.deleteContext(userId, contextId);
      await loadUserMemories();
    } catch (err) {
      console.error('Error deleting context:', err);
      setError(`Failed to delete context: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCleanupMemories = async (daysToKeep: number) => {
    try {
      await MemoryAPI.cleanupMemories(userId, daysToKeep);
      await loadUserMemories();
    } catch (err) {
      setError('Failed to cleanup memories');
      console.error('Error cleaning up memories:', err);
    }
  };

  const copySummaryToClipboard = async () => {
    if (aiSummary) {
      try {
        await navigator.clipboard.writeText(aiSummary);
        // Could show a toast notification here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const renderTabContent = () => {
    if (!userMemories) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="user-overview">
            <div className="overview-stats">
              <div className="stat-card">
                <div className="stat-icon">👤</div>
                <div className="stat-content">
                  <div className="stat-number">{Object.keys(userMemories.traits).length}</div>
                  <div className="stat-label">Traits</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔍</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {Object.keys(userMemories.dream_patterns.symbols).length + 
                     Object.keys(userMemories.dream_patterns.themes).length + 
                     Object.keys(userMemories.dream_patterns.emotions).length}
                  </div>
                  <div className="stat-label">Dream Patterns</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🧠</div>
                <div className="stat-content">
                  <div className="stat-number">{userMemories.memories.length}</div>
                  <div className="stat-label">Memories</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {userMemories.personal_context.life_events.length + 
                     userMemories.personal_context.goals.length}
                  </div>
                  <div className="stat-label">Context Items</div>
                </div>
              </div>
            </div>

            <div className="user-info">
              <div className="info-item">
                <span className="info-label">User ID:</span>
                <span className="info-value">{userMemories.user_id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Created:</span>
                <span className="info-value">{new Date(userMemories.created_at).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">{new Date(userMemories.last_updated).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="memory-summary-stats">
              <div className="summary-section">
                <h4>Memory Type Distribution</h4>
                <div className="type-distribution">
                  {Object.entries(
                    userMemories.memories.reduce((acc, memory) => {
                      acc[memory.type] = (acc[memory.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="type-item">
                      <span className="type-name">{type.replace('_', ' ')}</span>
                      <span className="type-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-section">
                <h4>Importance Distribution</h4>
                <div className="importance-distribution">
                  {Object.entries(
                    userMemories.memories.reduce((acc, memory) => {
                      acc[memory.importance] = (acc[memory.importance] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([importance, count]) => (
                    <div key={importance} className="importance-item">
                      <span className="importance-name">{importance}</span>
                      <span className="importance-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'traits':
        return (
          <div className="traits-section">
            <div className="section-header">
              <h3>User Traits</h3>
              <AddMemoryForm
                user_id={userId}
                memoryType="trait"
                onSubmit={handleAddTrait}
              />
            </div>
            <div className="traits-grid">
              {Object.entries(userMemories.traits).map(([key, trait]) => (
                <MemoryCard
                  key={key}
                  type="trait"
                  data={{ key, ...trait }}
                  onEdit={(data) => handleUpdateTrait(key, data)}
                  onDelete={() => handleDeleteTrait(key)}
                  importance="medium"
                />
              ))}
            </div>
          </div>
        );

      case 'patterns':
        return (
          <div className="patterns-section">
            <h3>Dream Patterns</h3>
            <div className="patterns-content">
              <PatternChart
                patterns={userMemories.dream_patterns.symbols}
                type="symbols"
                showTrend={true}
              />
              <PatternChart
                patterns={userMemories.dream_patterns.themes}
                type="themes"
                showTrend={true}
              />
              <PatternChart
                patterns={userMemories.dream_patterns.emotions}
                type="emotions"
                showTrend={true}
              />
            </div>
          </div>
        );

      case 'context':
        return (
          <div className="context-section">
            <div className="section-header">
              <h3>Personal Context</h3>
              <AddMemoryForm
                user_id={userId}
                memoryType="context"
                onSubmit={handleAddContext}
              />
            </div>
            <div className="context-grid">
              <div className="context-category">
                <h4>Life Events</h4>
                {userMemories.personal_context.life_events.map((event) => (
                  <MemoryCard
                    key={event.id}
                    type="context"
                    data={event}
                    onEdit={(data) => handleUpdateContext(event.id, data)}
                    onDelete={() => handleDeleteContext(event.id)}
                    importance={event.importance as 'low' | 'medium' | 'high'}
                  />
                ))}
              </div>
              <div className="context-category">
                <h4>Goals</h4>
                {userMemories.personal_context.goals.map((goal) => (
                  <MemoryCard
                    key={goal.id}
                    type="context"
                    data={goal}
                    onEdit={(data) => handleUpdateContext(goal.id, data)}
                    onDelete={() => handleDeleteContext(goal.id)}
                    importance={goal.importance as 'low' | 'medium' | 'high'}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'memories':
        return (
          <div className="memories-section">
            <div className="section-header">
              <h3>Memory Entries</h3>
              <AddMemoryForm
                user_id={userId}
                memoryType="memory"
                onSubmit={handleAddMemory}
              />
            </div>
            <div className="memories-grid">
              {userMemories.memories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  type="memory"
                  data={memory}
                  onEdit={(data) => handleUpdateMemory(memory.id, data)}
                  onDelete={() => handleDeleteMemory(memory.id)}
                  importance={memory.importance as 'low' | 'medium' | 'high'}
                />
              ))}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <MemoryAnalytics
            userMemories={userMemories}
            onCleanup={handleCleanupMemories}
          />
        );

      case 'summary':
        return (
          <div className="ai-summary-section">
            <div className="section-header">
              <h3>AI Context Summary</h3>
              <div className="summary-actions">
                <button
                  className="btn btn-secondary"
                  onClick={loadAiSummary}
                  disabled={summaryLoading}
                >
                  {summaryLoading ? 'Loading...' : 'Refresh Summary'}
                </button>
                {aiSummary && (
                  <button
                    className="btn btn-primary"
                    onClick={copySummaryToClipboard}
                  >
                    Copy to Clipboard
                  </button>
                )}
              </div>
            </div>
            <div className="summary-content">
              {aiSummary ? (
                <div className="summary-text">
                  {aiSummary}
                </div>
              ) : (
                <div className="summary-empty">
                  <p>Click "Refresh Summary" to generate AI context summary</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="user-memory-detail">
        <div className="detail-loading">
          <div className="loading-spinner"></div>
          <p>Loading user memory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-memory-detail">
        <div className="detail-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadUserMemories}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-memory-detail">
      <div className="detail-header">
        <div className="header-content">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              ← Back
            </button>
          )}
          <div className="header-info">
            <h2>Memory Management: {userId}</h2>
            <p>Manage memories, traits, and context for this user</p>
          </div>
        </div>
      </div>

      {userMemories && (
        <>
          <div className="detail-tabs">
            <button
              className={`detail-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`detail-tab ${activeTab === 'traits' ? 'active' : ''}`}
              onClick={() => setActiveTab('traits')}
            >
              Traits
            </button>
            <button
              className={`detail-tab ${activeTab === 'patterns' ? 'active' : ''}`}
              onClick={() => setActiveTab('patterns')}
            >
              Patterns
            </button>
            <button
              className={`detail-tab ${activeTab === 'context' ? 'active' : ''}`}
              onClick={() => setActiveTab('context')}
            >
              Context
            </button>
            <button
              className={`detail-tab ${activeTab === 'memories' ? 'active' : ''}`}
              onClick={() => setActiveTab('memories')}
            >
              Memories
            </button>
            <button
              className={`detail-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            <button
              className={`detail-tab ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              AI Summary
            </button>
          </div>

          <div className="detail-content">
            {renderTabContent()}
          </div>
        </>
      )}

      {!userMemories && !loading && !error && (
        <div className="detail-empty">
          <div className="empty-icon">🧠</div>
          <h3>No Memory Data</h3>
          <p>This user doesn't have any memory data yet.</p>
        </div>
      )}
    </div>
  );
};
