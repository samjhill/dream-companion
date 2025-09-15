import React, { useState, useEffect } from 'react';
import './MemoryDashboard.css';

interface MemoryStats {
  totalUsers: number;
  totalMemories: number;
  totalTraits: number;
  totalContextItems: number;
  averageMemoriesPerUser: number;
  memoryGrowth: Array<{
    date: string;
    count: number;
  }>;
  recentActivity: Array<{
    user_id: string;
    action: string;
    timestamp: string;
  }>;
}

interface UserSummary {
  user_id: string;
  memory_count: number;
  trait_count: number;
  context_count: number;
  last_activity: string;
  created_at: string;
}

export const MemoryDashboard: React.FC = () => {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll simulate the data since we don't have the actual API endpoints
      // In a real implementation, these would be actual API calls
      const mockStats: MemoryStats = {
        totalUsers: 156,
        totalMemories: 2847,
        totalTraits: 423,
        totalContextItems: 891,
        averageMemoriesPerUser: 18.2,
        memoryGrowth: generateMockGrowthData(timeRange),
        recentActivity: generateMockActivityData()
      };

      const mockUsers: UserSummary[] = [
        {
          user_id: '+15551234567',
          memory_count: 45,
          trait_count: 8,
          context_count: 12,
          last_activity: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
        },
        {
          user_id: '+15559876543',
          memory_count: 32,
          trait_count: 6,
          context_count: 9,
          last_activity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString()
        },
        {
          user_id: '+15551111111',
          memory_count: 67,
          trait_count: 12,
          context_count: 15,
          last_activity: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
        }
      ];

      setStats(mockStats);
      setRecentUsers(mockUsers);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockGrowthData = (range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const data = [];
    const baseCount = 2000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString(),
        count: baseCount + Math.floor(Math.random() * 100) + (days - i) * 5
      });
    }
    
    return data;
  };

  const generateMockActivityData = () => {
    const activities = [];
    const actions = ['memory_added', 'trait_updated', 'context_added', 'cleanup_performed'];
    
    for (let i = 0; i < 10; i++) {
      activities.push({
        user_id: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        action: actions[Math.floor(Math.random() * actions.length)],
        timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString()
      });
    }
    
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatAction = (action: string) => {
    switch (action) {
      case 'memory_added': return 'Added memory';
      case 'trait_updated': return 'Updated trait';
      case 'context_added': return 'Added context';
      case 'cleanup_performed': return 'Performed cleanup';
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'memory_added': return '🧠';
      case 'trait_updated': return '👤';
      case 'context_added': return '📝';
      case 'cleanup_performed': return '🧹';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="memory-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="memory-dashboard">
        <div className="dashboard-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="memory-dashboard">
        <div className="dashboard-empty">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-dashboard">
      <div className="dashboard-header">
        <h2>Memory Management Dashboard</h2>
        <p>Overview of user memory data and system activity</p>
        <div className="dashboard-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="time-range-selector"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧠</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalMemories}</div>
            <div className="stat-label">Total Memories</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalTraits}</div>
            <div className="stat-label">User Traits</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalContextItems}</div>
            <div className="stat-label">Context Items</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats.averageMemoriesPerUser.toFixed(1)}</div>
            <div className="stat-label">Avg Memories/User</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h3>Memory Growth</h3>
          <div className="growth-chart">
            <div className="chart-placeholder">
              <p>📈 Memory growth chart would be displayed here</p>
              <p>Total growth: +{stats.memoryGrowth[stats.memoryGrowth.length - 1]?.count - stats.memoryGrowth[0]?.count || 0} memories</p>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Recent Users</h3>
          <div className="users-list">
            {recentUsers.map((user) => (
              <div key={user.user_id} className="user-summary-card">
                <div className="user-info">
                  <div className="user-id">{user.user_id}</div>
                  <div className="user-stats">
                    <span className="user-stat">
                      <span className="stat-icon">🧠</span>
                      {user.memory_count} memories
                    </span>
                    <span className="user-stat">
                      <span className="stat-icon">👤</span>
                      {user.trait_count} traits
                    </span>
                    <span className="user-stat">
                      <span className="stat-icon">📝</span>
                      {user.context_count} context
                    </span>
                  </div>
                </div>
                <div className="user-activity">
                  <div className="last-activity">
                    Last active: {formatTimestamp(user.last_activity)}
                  </div>
                  <div className="user-created">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Recent Activity</h3>
          <div className="activity-feed">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {getActionIcon(activity.action)}
                </div>
                <div className="activity-content">
                  <div className="activity-action">
                    {formatAction(activity.action)}
                  </div>
                  <div className="activity-user">
                    User: {activity.user_id}
                  </div>
                </div>
                <div className="activity-time">
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
