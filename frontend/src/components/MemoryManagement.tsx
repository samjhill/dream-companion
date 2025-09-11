import React, { useState, useEffect } from 'react';
import { MemoryCard } from './MemoryCard';
import { PatternChart } from './PatternChart';
import { MemoryTimeline } from './MemoryTimeline';
import { AddMemoryForm } from './AddMemoryForm';
import { MemoryAnalytics } from './MemoryAnalytics';
import { MemoryAPI } from '../services/MemoryAPI';
import { getUserPhoneNumber } from '../helpers/user';
// Removed unused import
import './MemoryManagement.css';

// Remove User interface as we no longer need it

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

export const MemoryManagement: React.FC = () => {
  const [userMemories, setUserMemories] = useState<UserMemories | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'traits' | 'patterns' | 'context' | 'memories' | 'analytics'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUserMemories();
  }, []);

  const loadCurrentUserMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user's phone number
      const phoneNumber = await getUserPhoneNumber();
      if (!phoneNumber) {
        setError('Unable to get user information. Please try logging in again.');
        return;
      }
      
      // Remove the + prefix for the API call
      const userId = phoneNumber.replace('+', '');
      setCurrentUserId(userId);
      
      // Load user memories
      const response = await MemoryAPI.getUserMemories(userId);
      setUserMemories(response);
    } catch (err) {
      setError('Failed to load your memories');
      console.error('Error loading user memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrait = async (traitData: any) => {
    if (!currentUserId) return;
    
    try {
      await MemoryAPI.addTrait(currentUserId, traitData);
      await loadCurrentUserMemories();
    } catch (err) {
      setError('Failed to add trait');
      console.error('Error adding trait:', err);
    }
  };

  const handleAddMemory = async (memoryData: any) => {
    if (!currentUserId) return;
    
    try {
      await MemoryAPI.addMemory(currentUserId, memoryData);
      await loadCurrentUserMemories();
    } catch (err) {
      setError('Failed to add memory');
      console.error('Error adding memory:', err);
    }
  };

  const handleAddContext = async (contextData: any) => {
    if (!currentUserId) return;
    
    try {
      await MemoryAPI.addContext(currentUserId, contextData);
      await loadCurrentUserMemories();
    } catch (err) {
      setError('Failed to add context');
      console.error('Error adding context:', err);
    }
  };

  const handleCleanupMemories = async (daysToKeep: number) => {
    if (!currentUserId) return;
    
    try {
      await MemoryAPI.cleanupMemories(currentUserId, daysToKeep);
      await loadCurrentUserMemories();
    } catch (err) {
      setError('Failed to cleanup memories');
      console.error('Error cleaning up memories:', err);
    }
  };

  const renderTabContent = () => {
    if (!userMemories) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="memory-overview">
            <div className="overview-stats">
              <div className="stat-card">
                <h3>Traits</h3>
                <div className="stat-number">{Object.keys(userMemories.traits).length}</div>
              </div>
              <div className="stat-card">
                <h3>Dream Patterns</h3>
                <div className="stat-number">
                  {Object.keys(userMemories.dream_patterns.symbols).length + 
                   Object.keys(userMemories.dream_patterns.themes).length + 
                   Object.keys(userMemories.dream_patterns.emotions).length}
                </div>
              </div>
              <div className="stat-card">
                <h3>Memories</h3>
                <div className="stat-number">{userMemories.memories.length}</div>
              </div>
              <div className="stat-card">
                <h3>Context Items</h3>
                <div className="stat-number">
                  {userMemories.personal_context.life_events.length + 
                   userMemories.personal_context.goals.length}
                </div>
              </div>
            </div>
            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <MemoryTimeline memories={userMemories.memories} groupBy="type" />
            </div>
          </div>
        );

      case 'traits':
        return (
          <div className="traits-section">
            <div className="section-header">
              <h3>Your Traits</h3>
              <AddMemoryForm
                user_id={currentUserId || ''}
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
                  onEdit={handleAddTrait}
                  onDelete={() => {}}
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
            <div className="pattern-tabs">
              <button 
                className={`pattern-tab ${activeTab === 'patterns' ? 'active' : ''}`}
                onClick={() => setActiveTab('patterns')}
              >
                Symbols
              </button>
            </div>
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
              <h3>Your Personal Context</h3>
              <AddMemoryForm
                user_id={currentUserId || ''}
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
                    onEdit={handleAddContext}
                    onDelete={() => {}}
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
                    onEdit={handleAddContext}
                    onDelete={() => {}}
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
              <h3>Your Memories</h3>
              <AddMemoryForm
                user_id={currentUserId || ''}
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
                  onEdit={handleAddMemory}
                  onDelete={() => {}}
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

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="memory-management">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading memory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="memory-management">
        <div className="error-message">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-management">
      <div className="memory-header">
        <h2>Your Memory Profile</h2>
        <p>Manage your personal traits, dream patterns, and context to enhance your dream interpretations.</p>
      </div>

      {userMemories && (
        <>
          <div className="memory-tabs">
            <button
              className={`memory-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`memory-tab ${activeTab === 'traits' ? 'active' : ''}`}
              onClick={() => setActiveTab('traits')}
            >
              Traits
            </button>
            <button
              className={`memory-tab ${activeTab === 'patterns' ? 'active' : ''}`}
              onClick={() => setActiveTab('patterns')}
            >
              Patterns
            </button>
            <button
              className={`memory-tab ${activeTab === 'context' ? 'active' : ''}`}
              onClick={() => setActiveTab('context')}
            >
              Context
            </button>
            <button
              className={`memory-tab ${activeTab === 'memories' ? 'active' : ''}`}
              onClick={() => setActiveTab('memories')}
            >
              Memories
            </button>
            <button
              className={`memory-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </div>

          <div className="memory-content">
            {renderTabContent()}
          </div>
        </>
      )}

      {!userMemories && !loading && !error && (
        <div className="empty-state">
          <div className="empty-icon">🧠</div>
          <h3>No Memory Data</h3>
          <p>Your memory profile is being created. This will help personalize your dream interpretations.</p>
        </div>
      )}
    </div>
  );
};
