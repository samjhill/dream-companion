import React from 'react';
import { Link } from 'react-router-dom';
import './MarketingPage.css';
import OwlStandard from "../assets/clara-owl-standard.jpg";
import { Button } from '@aws-amplify/ui-react';
import DemoSMS from './DemoSMS';
import { HeatmapDemo } from './HeatmapDemo';
import { MarketingThemes } from './MarketingThemes';

export const MarketingPage: React.FC = () => {
  return (
    <>
      {/* Hero Section with SMS Demo */}
      <DemoSMS />
      
      <header className="marketing-header">
        <h1 className="marketing-title">Hoot hoot! Welcome.</h1>
        <div className="profile-container">
          <img src={OwlStandard} alt="Clara the Dream Mentor" className="profile-pic" />
        </div>
        <h1 className="marketing-title">I'm Clara, the Dream Mentor.</h1>
        <p>I can help you unlock the power of your dreams and gain insights into your waking life.</p>
      </header>
      
      <div className="marketing-container">
        <section className="marketing-content">
          <h2>Track, Reflect, Grow</h2>
          <p>Log your dreams, track your progress, and learn from the patterns emerging in your sleep.</p>
          <HeatmapDemo />

          <h2>Discover Your Patterns</h2>
          <p>I help you recognize recurring themes and offer practical guidance to explore your inner world.</p>
          <MarketingThemes />
        </section>

        <section className="get-started-section">
          <h2>How to get started</h2>
          <p className="get-started-text">
            Simply send a text message containing your dream to{' '}
            <a href="tel:877-754-1288" className="phone-number">877-754-1288</a>.
          </p>
          <p>
            By texting me, you consent to receive SMS updates from Old House Overhaul LLC. 
            Message and data rates may apply. Reply STOP to unsubscribe.
          </p>
        </section>

        <footer className="marketing-footer">
          <h2>Already a member?</h2>
          <Button>
            <Link to="/app">Sign in here</Link>
          </Button>
        </footer>
        
        <div className="footer-credit">
          <p>Made with love by <a target="_blank" rel="noopener noreferrer" href="https://github.com/samjhill">Sam Hill</a></p>
        </div>
      </div>
    </>
  );
};

