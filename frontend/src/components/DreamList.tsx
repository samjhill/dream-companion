import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { formatDate } from '../helpers/date';
import { getUserPhoneNumber } from '../helpers/user';
import { DreamHeatmap } from './HeatMap';

// Constants
const API_BASE_URL = "https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod";
const DREAMS_PER_PAGE = 10;

interface Dream {
  id: string;
  createdAt: string;
  dream_content: string;
  response: string;
  summary: string;
}

interface DreamContentProps {
  dream: Dream;
}

const DreamContent: React.FC<DreamContentProps> = ({ dream }) => {
  const [isOpen, setIsOpen] = useState(false);
  const date = formatDate(dream.createdAt);
  const summary = dream.summary?.split("\n\n")[0];
  const themes = dream.summary?.split("\n\n")[1];

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleCardClick = () => {
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      className='dream-container dream'
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-label={`Dream from ${date} - ${summary}`}
      onKeyDown={handleKeyDown}
    >
      <div className="dream-header">
        <div className="dream-summary">
          <p className="dream-text">{summary}</p>
          <p className="dream-date">{date}</p>
        </div>
        <button
          className="btn btn-ghost toggle-btn"
          onClick={handleToggle}
          aria-label={isOpen ? "Hide dream details" : "Show dream details"}
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen && (
        <div className="dream-details fade-in">
          <div className="dream-section">
            <h3>Your Dream</h3>
            <p className="dream-content">{dream.dream_content}</p>
          </div>

          <div className="dream-section">
            <h3>Interpretation</h3>
            <p className="dream-response">{dream.response}</p>
          </div>

          {themes && (
            <div className="dream-section">
              <h3>Themes</h3>
              <ul className="themes-list">
                {themes.split("\n").map((theme, index) => (
                  <li key={index} className="theme-item">
                    {theme.replace("-", "")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DreamList: React.FC = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalDreams, setTotalDreams] = useState(0);
  const [offset, setOffset] = useState(0);

  const fetchDreams = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const session = await fetchAuthSession();
      const phoneNumber = await getUserPhoneNumber();

      if (!phoneNumber) {
        setError("No phone number found. Please check your profile settings.");
        return;
      }

      const currentOffset = isLoadMore ? offset : 0;

      const response = await fetch(
        `${API_BASE_URL}/api/dreams/${phoneNumber.replace("+", "")}?limit=${DREAMS_PER_PAGE}&offset=${currentOffset}`,
        { headers: { 'Authorization': `Bearer ${session?.tokens?.accessToken}` } }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch dreams: ${response.status}`);
      }

      const data = await response.json();

      // Update pagination state
      setTotalDreams(data.total);
      setHasMore(data.hasMore);

      if (isLoadMore) {
        setOffset(currentOffset + DREAMS_PER_PAGE);
      } else {
        setOffset(DREAMS_PER_PAGE);
      }

      // Fetch individual dream details
      const dreamFiles: Dream[] = [];
      for (const dream of data.dreams) {
        const key = dream.key;

        try {
          const dreamResponse = await fetch(
            `${API_BASE_URL}/api/dreams/${key}`,
            { headers: { 'Authorization': `Bearer ${session?.tokens?.accessToken}` } }
          );

          if (!dreamResponse.ok) {
            console.warn(`Failed to fetch dream ${key}`);
            continue;
          }

          const dreamData: Dream = await dreamResponse.json();
          dreamFiles.push(dreamData);
        } catch (error) {
          console.warn(`Error fetching dream ${key}:`, error);
        }
      }

      // Sort by creation date (newest first) and update dreams
      const sortedDreams = dreamFiles.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (isLoadMore) {
        setDreams(prev => [...prev, ...sortedDreams]);
      } else {
        setDreams(sortedDreams);
      }
    } catch (error) {
      console.error("Error fetching dreams:", error);
      setError("Failed to load your dreams. Please try again later.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    fetchDreams(true);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  useEffect(() => {
    fetchDreams();
  }, [fetchDreams]);

  if (loading) {
    return (
      <div className="dream-journal">
        <div className="journal-header">
          <h2>Dream Journal</h2>
          <p className="text-muted">Loading your dreams...</p>
        </div>
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dream-journal">
        <div className="journal-header">
          <h2>Dream Journal</h2>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={handleRetry}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dream-journal">
      <div className="journal-header">
        <h2>Dream Journal</h2>
        {totalDreams > 0 && (
          <p className="text-muted">
            Showing {dreams.length} of {totalDreams} dream{totalDreams === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {dreams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌙</div>
          <h3>No dreams recorded yet</h3>
          <p className="text-muted">
            Your dreams will appear here once you start recording them.
          </p>
        </div>
      ) : (
        <>
          <DreamHeatmap dreams={dreams} />
          <div className="dreams-list">
            {dreams.map(dream => (
              <DreamContent key={dream.id} dream={dream} />
            ))}
          </div>

          {hasMore && (
            <div className="load-more-section">
              <button
                className="btn btn-secondary load-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
                aria-label="Load more dreams"
              >
                {loadingMore ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Loading...
                  </>
                ) : (
                  `Load More Dreams (${totalDreams - dreams.length} remaining)`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DreamList;
