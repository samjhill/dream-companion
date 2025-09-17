import React, { useState } from 'react';
import { FeedbackForm } from './FeedbackForm';
import './FeedbackButton.css';

interface FeedbackButtonProps {
  className?: string;
  variant?: 'floating' | 'inline' | 'minimal';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ 
  className = '', 
  variant = 'floating',
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (variant === 'floating') {
    return (
      <>
        <button
          className={`feedback-button floating ${position} ${className}`}
          onClick={handleToggle}
          aria-label="Open feedback form"
          title="Share your feedback"
        >
          <span className="feedback-icon">💬</span>
          <span className="feedback-text">Feedback</span>
        </button>
        
        {isOpen && (
          <div className="feedback-overlay" onClick={handleClose}>
            <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
              <div className="feedback-modal-header">
                <h3>Share Your Feedback</h3>
                <button 
                  className="feedback-close-btn"
                  onClick={handleClose}
                  aria-label="Close feedback form"
                >
                  ✕
                </button>
              </div>
              <FeedbackForm onClose={handleClose} />
            </div>
          </div>
        )}
      </>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        className={`feedback-button minimal ${className}`}
        onClick={handleToggle}
        aria-label="Open feedback form"
        title="Share your feedback"
      >
        <span className="feedback-icon">💬</span>
      </button>
    );
  }

  // Inline variant
  return (
    <div className={`feedback-button inline ${className}`}>
      <button
        className="feedback-trigger"
        onClick={handleToggle}
        aria-label="Open feedback form"
      >
        <span className="feedback-icon">💬</span>
        <span className="feedback-text">Share Feedback</span>
      </button>
      
      {isOpen && (
        <div className="feedback-inline-container">
          <FeedbackForm onClose={handleClose} />
        </div>
      )}
    </div>
  );
};

export default FeedbackButton;
