import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Dream from ${date}`}
    >
      <div className='dream-header'>
        <h3 className='dream-date'>{date}</h3>
        <button
          className={`dream-toggle ${isOpen ? 'open' : ''}`}
          onClick={handleToggle}
          aria-label={isOpen ? 'Collapse dream' : 'Expand dream'}
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>
      
      {summary && (
        <div className='dream-summary'>
          <p>{summary}</p>
        </div>
      )}
      
      {isOpen && (
        <div className='dream-details'>
          <div className='dream-content'>
            <h4>Dream Content:</h4>
            <p>{dream.dream_content}</p>
          </div>
          
          {dream.response && (
            <div className='dream-analysis'>
              <h4>Analysis:</h4>
              <p>{dream.response}</p>
            </div>
          )}
          
          {themes && (
            <div className='dream-themes'>
              <h4>Themes:</h4>
              <p>{themes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DreamListOptimized: React.FC = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalDreams, setTotalDreams] = useState(0);
  const [offset, setOffset] = useState(0);
  
  // Cache for individual dreams to prevent refetching
  const [dreamCache, setDreamCache] = useState<Map<string, Dream>>(new Map());
  // Track ongoing requests to prevent duplicates
  const [ongoingRequests, setOngoingRequests] = useState<Set<string>>(new Set());

  // Memoized function to fetch individual dream with caching
  const fetchIndividualDream = useCallback(async (dreamKey: string, phoneNumber: string, session: any): Promise<Dream | null> => {
    // dreamKey is already the full S3 key like "16464578206/dream-id.json"
    // Extract just the dream ID part
    const dreamId = dreamKey.split('/').pop(); // Get the last part after the slash
    const cacheKey = dreamKey; // Use the full key as cache key
    
    // Check cache first
    if (dreamCache.has(cacheKey)) {
      return dreamCache.get(cacheKey)!;
    }
    
    // Check if request is already ongoing
    if (ongoingRequests.has(cacheKey)) {
      return null; // Will be handled by the ongoing request
    }
    
    // Mark request as ongoing
    setOngoingRequests(prev => new Set(prev).add(cacheKey));
    
    try {
      const dreamResponse = await fetch(
        `${API_BASE_URL}/api/dreams/${phoneNumber.replace("+", "")}/${dreamId}`,
        { headers: { 'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}` } }
      );

      if (!dreamResponse.ok) {
        console.warn(`Failed to fetch dream ${dreamKey}`);
        return null;
      }

      const dreamData: Dream = await dreamResponse.json();
      
      // Cache the result
      setDreamCache(prev => new Map(prev).set(cacheKey, dreamData));
      
      return dreamData;
    } catch (error) {
      console.warn(`Error fetching dream ${dreamKey}:`, error);
      return null;
    } finally {
      // Remove from ongoing requests
      setOngoingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(cacheKey);
        return newSet;
      });
    }
  }, [dreamCache, ongoingRequests]);

  // Memoized fetchDreams function
  const fetchDreams = useCallback(async (isLoadMore = false) => {
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
        { headers: { 'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}` } }
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

      // Batch fetch individual dream details with caching
      const dreamPromises = data.dreams.map((dream: any) => 
        fetchIndividualDream(dream.key, phoneNumber, session)
      );
      
      const dreamResults = await Promise.all(dreamPromises);
      const dreamFiles = dreamResults.filter((dream): dream is Dream => dream !== null);

      // Sort by creation date (newest first) and update dreams
      const sortedDreams = dreamFiles.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (isLoadMore) {
        setDreams(prevDreams => [...prevDreams, ...sortedDreams]);
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
  }, [offset, fetchIndividualDream]);

  const handleLoadMore = useCallback(() => {
    fetchDreams(true);
  }, [fetchDreams]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Fix useEffect dependency - only run once on mount
  useEffect(() => {
    fetchDreams();
  }, []); // Empty dependency array - only run on mount

  // Memoized dream heatmap data
  const heatmapDreams = useMemo(() => {
    return dreams.map(dream => ({
      id: dream.id,
      createdAt: dream.createdAt,
      dream_content: dream.dream_content,
      response: dream.response,
      summary: dream.summary
    }));
  }, [dreams]);

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
          <p className="text-muted">Error loading dreams</p>
        </div>
        <div className="error">
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-button">
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
        <p className="text-muted">
          {totalDreams > 0 
            ? `You have ${totalDreams} dream${totalDreams === 1 ? '' : 's'} recorded`
            : 'No dreams recorded yet'
          }
        </p>
      </div>

      {dreams.length > 0 && (
        <div className="dream-heatmap">
          <h3>Dream Activity</h3>
          <DreamHeatmap dreams={heatmapDreams} />
        </div>
      )}

      <div className="dreams-list">
        {dreams.length === 0 ? (
          <div className="no-dreams">
            <p>No dreams found. Start recording your dreams to see them here!</p>
          </div>
        ) : (
          dreams.map((dream) => (
            <DreamContent key={dream.id} dream={dream} />
          ))
        )}
      </div>

      {hasMore && dreams.length > 0 && (
        <div className="load-more">
          <button 
            onClick={handleLoadMore} 
            disabled={loadingMore}
            className="load-more-button"
          >
            {loadingMore ? 'Loading...' : 'Load More Dreams'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DreamListOptimized;
