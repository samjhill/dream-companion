import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './SharedDreamArt.css';

interface SharedArtData {
  artId: string;
  fromPhone: string;
  toPhone: string;
  message: string;
  artConfig: any;
  dreamCount: number;
  createdAt: string;
  imageData: string;
}

const SharedDreamArt: React.FC = () => {
  const { artId } = useParams<{ artId: string }>();
  const [artData, setArtData] = useState<SharedArtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Constants
  const API_BASE_URL = "https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod";

  useEffect(() => {
    const fetchSharedArt = async () => {
      if (!artId) {
        setError("No art ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch shared art data from S3 via our API
        const response = await fetch(`${API_BASE_URL}/api/shared-art/${artId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("This dream art could not be found. It may have expired or the link is invalid.");
          }
          throw new Error(`Failed to load shared art: ${response.status}`);
        }

        const data = await response.json();
        setArtData(data);

        // Draw the art on canvas
        if (data.imageData && canvasRef.current) {
          drawArtFromImageData(data.imageData);
        }
      } catch (error) {
        console.error("Error fetching shared art:", error);
        setError(error instanceof Error ? error.message : "Failed to load shared art");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedArt();
  }, [artId]);

  const drawArtFromImageData = (imageData: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className="shared-art-container">
        <div className="shared-art-loading">
          <div className="loading-spinner"></div>
          <p>Loading shared dream art...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-art-container">
        <div className="shared-art-error">
          <h2>Unable to Load Dream Art</h2>
          <p>{error}</p>
          <a href="/" className="home-link">← Back to Clara's Dream Guide</a>
        </div>
      </div>
    );
  }

  if (!artData) {
    return (
      <div className="shared-art-container">
        <div className="shared-art-error">
          <h2>No Art Data Found</h2>
          <p>This dream art could not be loaded.</p>
          <a href="/" className="home-link">← Back to Clara's Dream Guide</a>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-art-container">
      <div className="shared-art-header">
        <div className="shared-art-brand">
          <h1>🎭 Clara's Dream Guide</h1>
          <p>Shared Dream Art</p>
        </div>
        <a href="/" className="home-link">Visit Clara's Dream Guide</a>
      </div>

      <div className="shared-art-content">
        <div className="shared-art-info">
          <div className="art-message">
            <h2>Dream Art Shared with You</h2>
            <p className="message-text">"{artData.message}"</p>
          </div>
          
          <div className="art-details">
            <div className="detail-item">
              <span className="detail-label">Generated from:</span>
              <span className="detail-value">{artData.dreamCount} dream{artData.dreamCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Art style:</span>
              <span className="detail-value">{artData.artConfig?.style || 'unique'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Shared on:</span>
              <span className="detail-value">{formatDate(artData.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="shared-art-canvas-container">
          <canvas
            ref={canvasRef}
            className="shared-art-canvas"
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </div>

      <div className="shared-art-footer">
        <div className="footer-content">
          <p>
            This dream art was generated using Clara's Dream Guide, an AI-powered dream analysis app. 
            Each piece is unique and inspired by the dreamer's personal journey.
          </p>
          <div className="footer-links">
            <a href="/" className="cta-link">Try Clara's Dream Guide</a>
            <a href="/sms-consent" className="secondary-link">Get Started</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedDreamArt;
