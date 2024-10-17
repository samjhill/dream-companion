import React from 'react';
import { Link } from 'react-router-dom';
import './MarketingPage.css'; // Optional: Add styles as needed
import OwlStandard from "../assets/clara-owl-standard.jpg";
import { Button } from '@aws-amplify/ui-react';

export const MarketingPage: React.FC = () => {
  return (
    <div className="marketing-container">
      <header className="marketing-header">
        <h1 style={{"textAlign": "center"}}>Hoot hoot! Welcome.</h1>
        <div style={{display: "flex"}}>
            <img src={OwlStandard} className="profile-pic" />
        </div>
        <h1 style={{"textAlign": "center"}}>I'm Clara, the Dream Mentor.</h1>
        <p>I can help you unlock the power of your dreams and gain insights into your waking life.</p>
      </header>

      <section className="marketing-content">
        <h2>Discover Your Patterns</h2>
        <p>I help you recognize recurring themes and offers practical guidance to explore your inner world.</p>

        <h2>Track, Reflect, Grow</h2>
        <p>Log your dreams, track your progress, and learn from the patterns emerging in your sleep.</p>
      </section>

      <section>
        <h2>How to get started</h2>
        <p>Simply send a text message containing your dream to <a href="tel:877-754-1288">877-754-1288</a>.</p>
      </section>

      <footer className="marketing-footer">
        <h3>Already a member? <Button><Link to="/app">Sign in here</Link></Button></h3>
      </footer>
    </div>
  );
};

