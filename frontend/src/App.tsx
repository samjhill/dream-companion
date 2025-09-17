import DreamList from './components/DreamList';
import { WakingLife } from './components/WakingLife';
import { Themes } from './components/Themes';
import { Greet } from './components/Greet';
import DreamArt from './components/DreamArt';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { signOut } from 'aws-amplify/auth';
import { LucidDreamGuide } from './components/LucidDreamGuide';
import { SubscriptionManager } from './components/SubscriptionManager';
import { AdvancedDreamAnalysis } from './components/AdvancedDreamAnalysis';
// import { PersonalMemoryManager } from './components/PersonalMemoryManager'; // Temporarily hidden
import { PremiumGate } from './components/PremiumGate';
import { usePremiumStatus } from './hooks/usePremiumStatus';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearUserAttributesCache } from './helpers/user';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { FeedbackButton } from './components/FeedbackButton';

// Constants
interface NavigationItem {
  id: 'overview' | 'dreams' | 'themes' | 'analysis' | 'guide' | 'waking' | 'premium'; // 'memory' temporarily removed
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
  // { id: 'memory', label: 'Memory Management', icon: '🧠', premium: true }, // Temporarily hidden
  { id: 'premium', label: 'Premium', icon: '💎' }
];

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { premiumStatus } = usePremiumStatus();
  
  // Get current section from URL or default to overview
  const getCurrentSection = (): NavigationItem['id'] => {
    const path = location.pathname.replace('/app', '') || '/';
    const section = path === '/' ? 'overview' : path.slice(1) as NavigationItem['id'];
    return NAVIGATION_ITEMS.some(item => item.id === section) ? section : 'overview';
  };
  
  const [activeSection, setActiveSection] = useState<NavigationItem['id']>(getCurrentSection());
  
  // Update active section when URL changes
  useEffect(() => {
    const newSection = getCurrentSection();
    setActiveSection(newSection);
  }, [location.pathname]);
  
  // Navigate to section and update URL
  const navigateToSection = (section: NavigationItem['id']) => {
    setActiveSection(section);
    const path = section === 'overview' ? '/app' : `/app/${section}`;
    navigate(path);
  };

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
        return (
          <PremiumGate feature="Advanced Dream Analysis">
            <AdvancedDreamAnalysis />
          </PremiumGate>
        );
      case 'guide':
        return <LucidDreamGuide />;
      case 'waking':
        return <WakingLife />;
      // case 'memory': // Temporarily hidden
      //   return (
      //     <PremiumGate feature="Personal Memory Management">
      //       <PersonalMemoryManager />
      //     </PremiumGate>
      //   );
      case 'premium':
        return <SubscriptionManager />;
      default:
        return (
          <div className="overview-section">
            <Greet />
            <DreamArt />
            <div className="overview-footer">
              <p className="overview-description">
                Your unique dream art evolves with every dream you share. 
                Move your mouse over the canvas to interact with your personal dreamscape.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {/* Floating Feedback Button */}
      <FeedbackButton variant="floating" position="bottom-right" />
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">🦉</span>
            Clara's Dream Guide
          </h1>
          <div className="header-actions">
            <FeedbackButton variant="minimal" />
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
              onClick={() => navigateToSection(item.id)}
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
