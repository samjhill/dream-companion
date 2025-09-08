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

        <section className="terms-section">
          <h2>Terms and Conditions of Data and Personal Information Collection</h2>
          <div className="terms-content">
            <h3>Data Collection and Use</h3>
            <p>
              By using our dream companion service, you consent to the collection, storage, and analysis of your personal information, including but not limited to:
            </p>
            <ul>
              <li>Dream content and descriptions you provide via SMS or web interface</li>
              <li>Personal reflections and insights you share</li>
              <li>Usage patterns and interaction data</li>
              <li>Contact information for SMS communications</li>
            </ul>

            <h3>Purpose of Data Collection</h3>
            <p>
              We collect this information to:
            </p>
            <ul>
              <li>Provide personalized dream analysis and insights</li>
              <li>Track patterns and themes in your dreams over time</li>
              <li>Improve our service and develop new features</li>
              <li>Send you relevant updates and communications</li>
            </ul>

            <h3>Data Security and Privacy</h3>
            <p>
              We are committed to protecting your privacy and personal information:
            </p>
            <ul>
              <li>All data is encrypted in transit and at rest</li>
              <li>Access to your personal information is restricted to authorized personnel only</li>
              <li>We do not sell, rent, or share your personal information with third parties without your explicit consent</li>
              <li>You may request access to, correction of, or deletion of your personal data at any time</li>
            </ul>

            <h3>Data Retention</h3>
            <p>
              We retain your personal information for as long as necessary to provide our services and as required by applicable law. You may request deletion of your account and associated data at any time.
            </p>

            <h3>Consent and Communication</h3>
            <p>
              By texting our service number (877-754-1288), you consent to receive SMS updates from Old House Overhaul LLC. Message and data rates may apply. Reply STOP to unsubscribe from SMS communications.
            </p>

            <h3>Changes to This Policy</h3>
            <p>
              We may update this privacy policy from time to time. We will notify you of any material changes via SMS or email. Continued use of our service constitutes acceptance of the updated policy.
            </p>

            <p className="terms-contact">
              For questions about this policy or your personal data, please contact us at{' '}
              <a href="mailto:privacy@dreamcompanion.app">privacy@dreamcompanion.app</a>
            </p>
          </div>
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

