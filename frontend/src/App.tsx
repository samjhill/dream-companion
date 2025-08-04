import DreamList from './components/DreamList';
import { WakingLife } from './components/WakingLife';
import { Themes } from './components/Themes';
import { Greet } from './components/Greet';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { signOut } from 'aws-amplify/auth';
import { LucidDreamGuide } from './components/LucidDreamGuide';
import { useState } from 'react';

function App() {
  const [activeSection, setActiveSection] = useState('overview');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'dreams', label: 'Dream Journal', icon: '📖' },
    { id: 'themes', label: 'Themes', icon: '🎨' },
    { id: 'guide', label: 'Lucid Guide', icon: '✨' },
    { id: 'waking', label: 'Waking Life', icon: '🌅' }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'dreams':
        return <DreamList />;
      case 'themes':
        return <Themes />;
      case 'guide':
        return <LucidDreamGuide />;
      case 'waking':
        return <WakingLife />;
      default:
        return (
          <div className="overview-section">
            <Greet />
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-grid">
                <button 
                  className="btn btn-primary action-card"
                  onClick={() => setActiveSection('dreams')}
                >
                  <span className="action-icon">📖</span>
                  <span>View Dream Journal</span>
                </button>
                <button 
                  className="btn btn-secondary action-card"
                  onClick={() => setActiveSection('themes')}
                >
                  <span className="action-icon">🎨</span>
                  <span>Explore Themes</span>
                </button>
                <button 
                  className="btn btn-secondary action-card"
                  onClick={() => setActiveSection('guide')}
                >
                  <span className="action-icon">✨</span>
                  <span>Lucid Dream Guide</span>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">🦉</span>
            Clara's Dream Guide
          </h1>
          <button 
            className="btn btn-ghost sign-out-btn"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-navigation">
        <div className="nav-container">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              aria-label={`Navigate to ${item.label}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        <div className="content-container fade-in">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

export default withAuthenticator(App);
