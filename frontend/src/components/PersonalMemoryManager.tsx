import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUserPhoneNumber } from '../helpers/user';
import { MemoryCard } from './MemoryCard';
import { AddMemoryForm } from './AddMemoryForm';
import './PersonalMemoryManager.css';

const API_BASE_URL = "https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod";

interface PersonalMemory {
  id: string;
  content: string;
  type: string;
  importance: string;
  tags: string[];
  created_at: string;
}

interface PersonalTrait {
  value: string;
  confidence: number;
  updated_at: string;
}

interface LifeEvent {
  id: string;
  value: string;
  importance: string;
  source: string;
  created_at: string;
}

interface PersonalGoal {
  id: string;
  value: string;
  importance: string;
  source: string;
  created_at: string;
}

interface UserMemories {
  user_id: string;
  traits: Record<string, PersonalTrait>;
  memories: PersonalMemory[];
  personal_context: {
    life_events: LifeEvent[];
    goals: PersonalGoal[];
  };
  created_at: string;
  last_updated: string;
}

export const PersonalMemoryManager: React.FC = () => {
  const [userMemories, setUserMemories] = useState<UserMemories | null>(null);
  const [activeTab, setActiveTab] = useState<'memories' | 'traits' | 'context'>('memories');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserMemories();
  }, []);

  const loadUserMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const phoneNumber = await getUserPhoneNumber();
      if (!phoneNumber) {
        setError('Unable to get user information. Please try logging in again.');
        return;
      }
      
      const userId = phoneNumber.replace('+', '');
      setCurrentUserId(userId);
      
      const session = await fetchAuthSession();
      const response = await fetch(
        `${API_BASE_URL}/api/memories/user/${userId}`,
        { headers: { 'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}` } }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError('Premium subscription required for memory management features.');
          return;
        }
        throw new Error(`Failed to fetch memories: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched user memories:', data);
      setUserMemories(data);
    } catch (err) {
      setError('Failed to load your personal memories');
      console.error('Error loading user memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async (memoryData: any) => {
    if (!currentUserId) return;
    
    try {
      setError(null);
      const session = await fetchAuthSession();
      const response = await fetch(
        `${API_BASE_URL}/api/memories/user/${currentUserId}/memory`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}`
          },
          body: JSON.stringify(memoryData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add memory: ${response.status}`);
      }

      await loadUserMemories();
    } catch (err) {
      console.error('Error adding memory:', err);
      setError(`Failed to add memory: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAddTrait = async (traitData: any) => {
    if (!currentUserId) return;
    
    try {
      setError(null);
      const session = await fetchAuthSession();
      const response = await fetch(
        `${API_BASE_URL}/api/memories/user/${currentUserId}/trait`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}`
          },
          body: JSON.stringify(traitData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add trait: ${response.status}`);
      }

      await loadUserMemories();
    } catch (err) {
      console.error('Error adding trait:', err);
      setError(`Failed to add trait: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAddContext = async (contextData: any) => {
    if (!currentUserId) return;
    
    try {
      setError(null);
      const session = await fetchAuthSession();
      const response = await fetch(
        `${API_BASE_URL}/api/memories/user/${currentUserId}/context`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}`
          },
          body: JSON.stringify(contextData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add context: ${response.status}`);
      }

      await loadUserMemories();
    } catch (err) {
      console.error('Error adding context:', err);
      setError(`Failed to add context: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const renderTabContent = () => {
    if (!userMemories) return null;
    
    console.log('Rendering tab content for:', activeTab, {
      memories: userMemories.memories?.length || 0,
      traits: Object.keys(userMemories.traits || {}).length,
      lifeEvents: userMemories.personal_context?.life_events?.length || 0,
      goals: userMemories.personal_context?.goals?.length || 0
    });

    switch (activeTab) {
      case 'memories':
        return (
          <div className="memories-tab">
            <div className="tab-header">
              <h3>Your Personal Memories</h3>
              <p className="tab-description">
                Keep track of important life events, observations, and insights that help personalize your dream interpretations.
              </p>
            </div>
            <AddMemoryForm
              user_id={currentUserId || ''}
              memoryType="memory"
              onSubmit={handleAddMemory}
            />
            <div className="memories-grid">
              {userMemories.memories.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h4>No memories yet</h4>
                  <p>Add your first memory to get started!</p>
                </div>
              ) : (
                userMemories.memories.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    type="memory"
                    data={memory}
                    onEdit={handleAddMemory}
                    onDelete={() => {}}
                    importance={memory.importance as 'low' | 'medium' | 'high'}
                  />
                ))
              )}
            </div>
          </div>
        );

      case 'traits':
        return (
          <div className="traits-tab">
            <div className="tab-header">
              <h3>Your Personal Traits</h3>
              <p className="tab-description">
                Define your personality traits and characteristics to help Clara understand you better.
              </p>
            </div>
            <AddMemoryForm
              user_id={currentUserId || ''}
              memoryType="trait"
              onSubmit={handleAddTrait}
            />
            <div className="traits-grid">
              {Object.keys(userMemories.traits).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎭</div>
                  <h4>No traits defined yet</h4>
                  <p>Add your first personality trait to get started!</p>
                </div>
              ) : (
                Object.entries(userMemories.traits).map(([key, trait]) => (
                  <MemoryCard
                    key={key}
                    type="trait"
                    data={{ key, ...trait }}
                    onEdit={handleAddTrait}
                    onDelete={() => {}}
                    importance="medium"
                  />
                ))
              )}
            </div>
          </div>
        );

      case 'context':
        return (
          <div className="context-tab">
            <div className="tab-header">
              <h3>Your Life Context</h3>
              <p className="tab-description">
                Share important life events and goals to help Clara provide more relevant dream interpretations.
              </p>
            </div>
            <AddMemoryForm
              user_id={currentUserId || ''}
              memoryType="context"
              onSubmit={handleAddContext}
            />
            <div className="context-sections">
              <div className="context-section">
                <h4>Life Events</h4>
                <div className="context-grid">
                  {userMemories.personal_context.life_events.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📅</div>
                      <p>No life events added yet</p>
                    </div>
                  ) : (
                    userMemories.personal_context.life_events.map((event) => (
                      <MemoryCard
                        key={event.id}
                        type="context"
                        data={event}
                        onEdit={handleAddContext}
                        onDelete={() => {}}
                        importance={event.importance as 'low' | 'medium' | 'high'}
                      />
                    ))
                  )}
                </div>
              </div>
              <div className="context-section">
                <h4>Goals & Aspirations</h4>
                <div className="context-grid">
                  {userMemories.personal_context.goals.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🎯</div>
                      <p>No goals added yet</p>
                    </div>
                  ) : (
                    userMemories.personal_context.goals.map((goal) => (
                      <MemoryCard
                        key={goal.id}
                        type="context"
                        data={goal}
                        onEdit={handleAddContext}
                        onDelete={() => {}}
                        importance={goal.importance as 'low' | 'medium' | 'high'}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="personal-memory-manager">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your personal memories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="personal-memory-manager">
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Memories</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadUserMemories}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-memory-manager">
      <div className="memory-header">
        <h2>🧠 Your Personal Memory Profile</h2>
        <p className="header-description">
          Help Clara understand you better by sharing your memories, traits, and life context. 
          This information stays private and helps personalize your dream interpretations.
        </p>
      </div>

      {userMemories && (
        <>
          <div className="memory-tabs">
            <button
              className={`memory-tab ${activeTab === 'memories' ? 'active' : ''}`}
              onClick={() => setActiveTab('memories')}
            >
              📝 Memories
            </button>
            <button
              className={`memory-tab ${activeTab === 'traits' ? 'active' : ''}`}
              onClick={() => setActiveTab('traits')}
            >
              🎭 Traits
            </button>
            <button
              className={`memory-tab ${activeTab === 'context' ? 'active' : ''}`}
              onClick={() => setActiveTab('context')}
            >
              📅 Life Context
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
          <h3>Setting Up Your Memory Profile</h3>
          <p>We're preparing your personal memory space. This will help Clara provide more personalized dream interpretations.</p>
        </div>
      )}
    </div>
  );
};
