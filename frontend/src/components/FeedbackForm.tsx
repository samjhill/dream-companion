import React, { useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './FeedbackForm.css';

// Constants
const API_BASE_URL = "https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod";

interface FeedbackFormProps {
  onClose?: () => void;
  className?: string;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose, className = '' }) => {
  const [rating, setRating] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [comment, setComment] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating) {
      setErrorMessage('Please select a rating (thumbs up or thumbs down)');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          type: feedbackType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      setSubmitStatus('success');
      setRating(null);
      setComment('');
      setFeedbackType('general');
      
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (selectedRating: 'thumbs_up' | 'thumbs_down') => {
    setRating(selectedRating);
    setErrorMessage('');
  };

  if (submitStatus === 'success') {
    return (
      <div className={`feedback-form ${className}`}>
        <div className="feedback-success">
          <div className="success-icon">✅</div>
          <h3>Thank you for your feedback!</h3>
          <p>Your input helps us improve Clara's Dream Guide.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`feedback-form ${className}`}>
      <div className="feedback-header">
        <h3>Share Your Feedback</h3>
        <p>Help us improve Clara's Dream Guide by sharing your thoughts</p>
      </div>

      <form onSubmit={handleSubmit} className="feedback-form-content">
        {/* Rating Selection */}
        <div className="feedback-section">
          <label className="feedback-label">How would you rate your experience?</label>
          <div className="rating-buttons">
            <button
              type="button"
              className={`rating-btn thumbs-up ${rating === 'thumbs_up' ? 'selected' : ''}`}
              onClick={() => handleRatingClick('thumbs_up')}
              disabled={isSubmitting}
            >
              <span className="rating-icon">👍</span>
              <span className="rating-text">Good</span>
            </button>
            <button
              type="button"
              className={`rating-btn thumbs-down ${rating === 'thumbs_down' ? 'selected' : ''}`}
              onClick={() => handleRatingClick('thumbs_down')}
              disabled={isSubmitting}
            >
              <span className="rating-icon">👎</span>
              <span className="rating-text">Needs Improvement</span>
            </button>
          </div>
        </div>

        {/* Feedback Type */}
        <div className="feedback-section">
          <label className="feedback-label">What type of feedback is this?</label>
          <select
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value)}
            className="feedback-select"
            disabled={isSubmitting}
          >
            <option value="general">General Feedback</option>
            <option value="feature">Feature Request</option>
            <option value="bug">Bug Report</option>
            <option value="ui">User Interface</option>
            <option value="performance">Performance</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Comment Section */}
        <div className="feedback-section">
          <label className="feedback-label">
            Additional comments (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience, suggestions, or any issues you encountered..."
            className="feedback-textarea"
            rows={4}
            maxLength={1000}
            disabled={isSubmitting}
          />
          <div className="character-count">
            {comment.length}/1000 characters
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="feedback-error">
            {errorMessage}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="feedback-actions">
          <button
            type="submit"
            className="btn btn-primary feedback-submit"
            disabled={!rating || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
          {onClose && (
            <button
              type="button"
              className="btn btn-secondary feedback-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
