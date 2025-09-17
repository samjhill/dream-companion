import React, { useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUserPhoneNumber } from '../helpers/user';

// Constants
const API_BASE_URL = "https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod";

interface ShareDreamArtProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  artConfig: {
    style: string;
    colors: string[];
    patterns: any;
    intensity: number;
    complexity: number;
  } | null;
  dreamCount: number;
}

export const ShareDreamArt: React.FC<ShareDreamArtProps> = ({ 
  canvasRef, 
  artConfig, 
  dreamCount 
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleShare = async () => {
    if (!canvasRef.current || !artConfig) {
      setError('Art not ready for sharing yet');
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(false);

    try {
      const session = await fetchAuthSession();
      const userPhoneNumber = await getUserPhoneNumber();

      if (!userPhoneNumber) {
        throw new Error('No phone number found');
      }

      // Capture canvas as image
      const canvas = canvasRef.current;
      const imageDataUrl = canvas.toDataURL('image/png', 0.8);
      
      // Create share message
      const defaultMessage = `Check out my unique dream art! 🎭 Generated from ${dreamCount} dream${dreamCount === 1 ? '' : 's'} I've shared. Style: ${artConfig.style}. View it at:`;
      const finalMessage = shareMessage || defaultMessage;

      // Send SMS with art data
      const response = await fetch(`${API_BASE_URL}/api/share-art`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}`
        },
        body: JSON.stringify({
          fromPhone: userPhoneNumber,
          toPhone: recipientPhone,
          message: finalMessage,
          imageData: imageDataUrl,
          artConfig: artConfig,
          dreamCount: dreamCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send SMS');
      }

      setSuccess(true);
      setRecipientPhone('');
      setShareMessage('');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error('Error sharing art:', error);
      setError(error instanceof Error ? error.message : 'Failed to share art');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 10) value = value.slice(0, 10);
    setRecipientPhone(value);
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="share-dream-art">
      <div className="share-header">
        <h3>Share Your Dream Art</h3>
        <p>Send your unique generative art to friends via SMS</p>
      </div>

      <div className="share-form">
        <div className="form-group">
          <label htmlFor="recipient-phone">Recipient Phone Number</label>
          <input
            id="recipient-phone"
            type="tel"
            value={formatPhoneNumber(recipientPhone)}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            className="phone-input"
            disabled={isSharing}
          />
        </div>

        <div className="form-group">
          <label htmlFor="share-message">Custom Message (Optional)</label>
          <textarea
            id="share-message"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder="Check out my unique dream art! 🎭 Generated from my dreams..."
            className="message-input"
            rows={3}
            disabled={isSharing}
          />
        </div>

        <button
          onClick={handleShare}
          disabled={isSharing || !recipientPhone || recipientPhone.length !== 10}
          className="share-button"
        >
          {isSharing ? (
            <>
              <span className="loading-spinner"></span>
              Sending SMS...
            </>
          ) : (
            <>
              📱 Send Art via SMS
            </>
          )}
        </button>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            Art shared successfully! Your friend will receive an SMS with your dream art.
          </div>
        )}
      </div>

      <div className="share-info">
        <p className="share-note">
          <strong>Note:</strong> Your art will be sent as an image along with your message. 
          Standard SMS rates may apply.
        </p>
      </div>
    </div>
  );
};

export default ShareDreamArt;
