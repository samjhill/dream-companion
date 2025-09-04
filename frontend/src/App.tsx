import DreamList from './components/DreamList';
import { WakingLife } from './components/WakingLife';
import { Themes } from './components/Themes';
import { Greet } from './components/Greet';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { signOut } from 'aws-amplify/auth';
import { LucidDreamGuide } from './components/LucidDreamGuide';
import { SubscriptionManager } from './components/SubscriptionManager';
import { AdvancedDreamAnalysis } from './components/AdvancedDreamAnalysis';
import { usePremiumStatus } from './hooks/usePremiumStatus';
import { useState } from 'react';
import { clearUserAttributesCache } from './helpers/user';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';

// Constants
interface NavigationItem {
  id: 'overview' | 'dreams' | 'themes' | 'analysis' | 'guide' | 'waking' | 'premium';
  label: string;
  icon: string;
  premium?: boolean;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'dreams', label: 'Dream Journal', icon: '📖' },
  { id: 'themes', label: 'Themes', icon: '🎨' },
  { id: 'analysis', label: 'Advanced Analysis', icon: '🔍', premium: true },
  { id: 'guide', label: 'Lucid Guide', icon: '✨' },
  { id: 'waking', label: 'Waking Life', icon: '🌅' },
  { id: 'premium', label: 'Premium', icon: '💎' }
];

function App() {
  const [activeSection, setActiveSection] = useState<NavigationItem['id']>('overview');
  const { premiumStatus } = usePremiumStatus();

  const handleSignOut = async () => {
    try {
      // Clear user data cache before signing out
      clearUserAttributesCache();
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dreams':
        return <DreamList />;
      case 'themes':
        return <Themes />;
      case 'analysis':
        return <AdvancedDreamAnalysis />;
      case 'guide':
        return <LucidDreamGuide />;
      case 'waking':
        return <WakingLife />;
      case 'premium':
        return <SubscriptionManager />;
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
                  className={`btn ${premiumStatus?.has_premium ? 'btn-secondary' : 'btn-disabled'} action-card`}
                  onClick={() => setActiveSection('analysis')}
                  disabled={!premiumStatus?.has_premium}
                >
                  <span className="action-icon">🔍</span>
                  <span>Advanced Analysis</span>
                  {!premiumStatus?.has_premium && <span className="premium-badge">💎</span>}
                </button>
                <button
                  className="btn btn-secondary action-card"
                  onClick={() => setActiveSection('guide')}
                >
                  <span className="action-icon">✨</span>
                  <span>Lucid Dream Guide</span>
                </button>
                <button
                  className="btn btn-secondary action-card"
                  onClick={() => setActiveSection('premium')}
                >
                  <span className="action-icon">💎</span>
                  <span>Premium Features</span>
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
          <div className="header-actions">
            <ThemeToggle />
            <button
              className="btn btn-ghost sign-out-btn"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-navigation">
        <div className="nav-container">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''} ${item.premium ? 'premium-feature' : ''} ${item.premium && !premiumStatus?.has_premium ? 'premium-locked' : ''}`}
              onClick={() => setActiveSection(item.id)}
              disabled={item.premium && !premiumStatus?.has_premium}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.premium && !premiumStatus?.has_premium && <span className="premium-badge">💎</span>}
              {item.premium && premiumStatus?.has_premium && <span className="premium-active">✨</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {renderSection()}
      </main>
    </div>
  );
}

const AppWithAuth = withAuthenticator(App);

export default function AppWrapper() {
  return (
    <ThemeProvider>
      <AppWithAuth />
    </ThemeProvider>
  );
}
