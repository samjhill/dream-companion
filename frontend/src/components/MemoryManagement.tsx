import React, { useState } from 'react';
import { MemoryDashboard } from './MemoryDashboard';
import { UserMemoryBrowser } from './UserMemoryBrowser';
import { UserMemoryDetail } from './UserMemoryDetail';
import './MemoryManagement.css';

// Admin Memory Management Interface
export const MemoryManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'browser' | 'detail'>('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView('detail');
  };

  const handleBackToBrowser = () => {
    setCurrentView('browser');
    setSelectedUserId(null);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedUserId(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="memory-management-container">
            <div className="management-header">
              <h2>Memory Management System</h2>
              <p>Admin interface for managing user memories across the platform</p>
              <div className="management-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentView('browser')}
                >
                  Browse Users
                </button>
              </div>
            </div>
            <MemoryDashboard />
          </div>
        );

      case 'browser':
        return (
          <div className="memory-management-container">
            <div className="management-header">
              <h2>User Memory Browser</h2>
              <p>Browse and search users with memory data</p>
              <div className="management-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleBackToDashboard}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
            <UserMemoryBrowser onUserSelect={handleUserSelect} />
          </div>
        );

      case 'detail':
        return (
          <div className="memory-management-container">
            <UserMemoryDetail
              userId={selectedUserId!}
              onBack={handleBackToBrowser}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="memory-management">
      {renderCurrentView()}
    </div>
  );
};
