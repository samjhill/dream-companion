import React, { useState, useEffect } from 'react';
import './UserMemoryBrowser.css';

interface UserSummary {
  user_id: string;
  memory_count: number;
  trait_count: number;
  context_count: number;
  last_activity: string;
  created_at: string;
  has_memories: boolean;
}

interface UserMemoryBrowserProps {
  onUserSelect?: (userId: string) => void;
}

export const UserMemoryBrowser: React.FC<UserMemoryBrowserProps> = ({
  onUserSelect
}) => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'memory_count' | 'last_activity' | 'created_at'>('last_activity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'with_memories' | 'recent'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, sortBy, sortOrder, filterBy]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll simulate the data since we don't have the actual API endpoints
      // In a real implementation, this would be an actual API call to get all users
      const mockUsers: UserSummary[] = generateMockUsers();
      
      setUsers(mockUsers);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockUsers = (): UserSummary[] => {
    const users: UserSummary[] = [];
    const baseTime = Date.now();
    
    for (let i = 0; i < 150; i++) {
      const userId = `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
      const memoryCount = Math.floor(Math.random() * 100);
      const traitCount = Math.floor(Math.random() * 15);
      const contextCount = Math.floor(Math.random() * 25);
      const daysSinceCreated = Math.floor(Math.random() * 365);
      const hoursSinceActivity = Math.floor(Math.random() * 24 * 30);
      
      users.push({
        user_id: userId,
        memory_count: memoryCount,
        trait_count: traitCount,
        context_count: contextCount,
        last_activity: new Date(baseTime - hoursSinceActivity * 60 * 60 * 1000).toISOString(),
        created_at: new Date(baseTime - daysSinceCreated * 24 * 60 * 60 * 1000).toISOString(),
        has_memories: memoryCount > 0
      });
    }
    
    return users;
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'with_memories':
        filtered = filtered.filter(user => user.has_memories);
        break;
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(user => 
          new Date(user.last_activity) > sevenDaysAgo
        );
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'memory_count':
          aValue = a.memory_count;
          bValue = b.memory_count;
          break;
        case 'last_activity':
          aValue = new Date(a.last_activity).getTime();
          bValue = new Date(b.last_activity).getTime();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
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
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleUserClick = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
  };

  const getTotalPages = () => {
    return Math.ceil(filteredUsers.length / itemsPerPage);
  };

  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getMemoryStatus = (user: UserSummary) => {
    if (user.memory_count === 0) return { status: 'empty', color: '#666', text: 'No memories' };
    if (user.memory_count < 10) return { status: 'low', color: '#ffaa00', text: 'Few memories' };
    if (user.memory_count < 50) return { status: 'medium', color: '#44ff44', text: 'Good activity' };
    return { status: 'high', color: '#00aa44', text: 'Very active' };
  };

  if (loading) {
    return (
      <div className="user-memory-browser">
        <div className="browser-loading">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-memory-browser">
        <div className="browser-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadUsers}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-memory-browser">
      <div className="browser-header">
        <h2>User Memory Browser</h2>
        <p>Browse and manage user memories across the system</p>
      </div>

      <div className="browser-controls">
        <div className="search-controls">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="filter-controls">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="with_memories">With Memories</option>
            <option value="recent">Recent Activity</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy as any);
              setSortOrder(newSortOrder as any);
            }}
            className="sort-select"
          >
            <option value="last_activity-desc">Last Activity (Newest)</option>
            <option value="last_activity-asc">Last Activity (Oldest)</option>
            <option value="memory_count-desc">Memory Count (High)</option>
            <option value="memory_count-asc">Memory Count (Low)</option>
            <option value="created_at-desc">Created (Newest)</option>
            <option value="created_at-asc">Created (Oldest)</option>
          </select>
        </div>
      </div>

      <div className="browser-stats">
        <div className="stat-item">
          <span className="stat-label">Total Users:</span>
          <span className="stat-value">{users.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">With Memories:</span>
          <span className="stat-value">{users.filter(u => u.has_memories).length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Showing:</span>
          <span className="stat-value">{filteredUsers.length}</span>
        </div>
      </div>

      <div className="users-grid">
        {getCurrentPageUsers().map((user) => {
          const memoryStatus = getMemoryStatus(user);
          
          return (
            <div
              key={user.user_id}
              className="user-card"
              onClick={() => handleUserClick(user.user_id)}
            >
              <div className="user-header">
                <div className="user-id">{user.user_id}</div>
                <div 
                  className="memory-status"
                  style={{ backgroundColor: memoryStatus.color }}
                >
                  {memoryStatus.text}
                </div>
              </div>

              <div className="user-stats">
                <div className="user-stat">
                  <span className="stat-icon">🧠</span>
                  <span className="stat-label">Memories</span>
                  <span className="stat-value">{user.memory_count}</span>
                </div>
                <div className="user-stat">
                  <span className="stat-icon">👤</span>
                  <span className="stat-label">Traits</span>
                  <span className="stat-value">{user.trait_count}</span>
                </div>
                <div className="user-stat">
                  <span className="stat-icon">📝</span>
                  <span className="stat-label">Context</span>
                  <span className="stat-value">{user.context_count}</span>
                </div>
              </div>

              <div className="user-activity">
                <div className="activity-item">
                  <span className="activity-label">Last Active:</span>
                  <span className="activity-value">{formatTimestamp(user.last_activity)}</span>
                </div>
                <div className="activity-item">
                  <span className="activity-label">Joined:</span>
                  <span className="activity-value">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="user-actions">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserClick(user.user_id);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {getTotalPages() > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {getTotalPages()}
          </div>
          
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === getTotalPages()}
          >
            Next
          </button>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="no-users">
          <div className="no-users-icon">👥</div>
          <h3>No users found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};
