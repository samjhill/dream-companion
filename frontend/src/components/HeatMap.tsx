import React, { useState } from 'react';
import { format, eachDayOfInterval, subDays, startOfToday } from 'date-fns';

// Constants
const SHADING_LEVELS = {
  NO_DREAMS: '#ebedf0',
  ONE_DREAM: '#9be9a8',
  TWO_DREAMS: '#40c463',
  THREE_DREAMS: '#30a14e',
  FOUR_PLUS_DREAMS: '#216e39'
} as const;

const DEFAULT_BOX_SIZE = 16;
const COMPACT_BOX_SIZE = 12;
const DEFAULT_GAP = 4;
const COMPACT_GAP = 2;

/**
 * Interface for dream data structure
 */
interface Dream {
  createdAt: string;
  dream_content?: string;
  summary?: string;
  response?: string;
  analysis?: string;
  interpretation?: string;
  ai_response?: string;
  dream_analysis?: string;
  insights?: string;
}

/**
 * Type for mapping dates to dream data with enhanced metrics
 */
type DreamData = {
  [date: string]: {
    count: number;
    intensity: number;
    quality: number;
    weightedScore: number;
  };
};

/**
 * Component props for the DreamHeatmap
 */
interface DreamHeatmapProps {
  dreams: Dream[];
  numberOfDays?: number;
  showLegend?: boolean;
  compact?: boolean;
}

/**
 * Calculates dream intensity based on content analysis
 */
const calculateDreamIntensity = (dream: Dream): number => {
  if (!dream.dream_content && !dream.summary) return 0.1;
  
  const content = `${dream.dream_content || ''} ${dream.summary || ''}`;
  const words = content.toLowerCase().split(' ');
  
  // Emotional intensity words
  const intensityWords = {
    high: ['terrified', 'ecstatic', 'furious', 'devastated', 'euphoric', 'horrified', 'blissful', 'enraged', 'thrilled', 'petrified'],
    medium: ['scared', 'happy', 'angry', 'sad', 'excited', 'worried', 'joyful', 'frustrated', 'peaceful', 'anxious'],
    low: ['calm', 'content', 'mild', 'gentle', 'quiet', 'serene', 'soft', 'light', 'easy', 'simple']
  };
  
  let intensityScore = 0;
  words.forEach(word => {
    if (intensityWords.high.includes(word)) intensityScore += 3;
    else if (intensityWords.medium.includes(word)) intensityScore += 2;
    else if (intensityWords.low.includes(word)) intensityScore += 1;
  });
  
  // Normalize by content length
  const normalizedIntensity = Math.min(intensityScore / Math.max(words.length / 10, 1), 1);
  return Math.max(normalizedIntensity, 0.1); // Minimum intensity
};

/**
 * Calculates dream quality based on content richness
 */
const calculateDreamQuality = (dream: Dream): number => {
  if (!dream.dream_content && !dream.summary) return 0.1;
  
  const content = `${dream.dream_content || ''} ${dream.summary || ''}`;
  const words = content.split(' ');
  
  // Quality indicators
  const qualityFactors = {
    length: Math.min(words.length / 100, 1), // Longer dreams are generally richer
    detail: content.includes('because') || content.includes('when') || content.includes('where') ? 0.3 : 0,
    sensory: (content.match(/saw|heard|felt|smelled|tasted/g) || []).length * 0.1,
    dialogue: (content.match(/said|told|asked|answered/g) || []).length * 0.1,
    action: (content.match(/ran|walked|flew|swam|drove/g) || []).length * 0.1
  };
  
  const qualityScore = Object.values(qualityFactors).reduce((sum, factor) => sum + factor, 0);
  return Math.min(qualityScore, 1);
};

/**
 * Determines the background color based on enhanced dream metrics
 * Uses a green color scale similar to GitHub's contribution graph
 */
const getShadingLevel = (dreamData: DreamData[string]): string => {
  if (!dreamData || dreamData.count === 0) return SHADING_LEVELS.NO_DREAMS;
  
  // Use weighted score for shading (combines count, intensity, and quality)
  const score = dreamData.weightedScore;
  
  if (score < 0.2) return SHADING_LEVELS.ONE_DREAM;
  if (score < 0.4) return SHADING_LEVELS.TWO_DREAMS;
  if (score < 0.6) return SHADING_LEVELS.THREE_DREAMS;
  if (score < 0.8) return SHADING_LEVELS.FOUR_PLUS_DREAMS;
  return SHADING_LEVELS.FOUR_PLUS_DREAMS; // Maximum intensity
};

/**
 * Enhanced dream processing for heatmap with intensity and quality metrics
 */
const processDreamsForHeatmapEnhanced = (dreams: Dream[]): DreamData => {
  const dreamData: DreamData = {};

  if (!Array.isArray(dreams)) {
    console.warn('processDreamsForHeatmapEnhanced: dreams parameter is not an array');
    return dreamData;
  }

  dreams.forEach((dream, index) => {
    if (!dream.createdAt) {
      console.warn(`processDreamsForHeatmapEnhanced: Invalid dream at index ${index}:`, dream);
      return;
    }

    try {
      const dreamDate = new Date(dream.createdAt);
      const dateStr = format(dreamDate, 'yyyy-MM-dd');
      
      // Calculate metrics for this dream
      const intensity = calculateDreamIntensity(dream);
      const quality = calculateDreamQuality(dream);
      
      // Initialize day data if not exists
      if (!dreamData[dateStr]) {
        dreamData[dateStr] = { count: 0, intensity: 0, quality: 0, weightedScore: 0 };
      }
      
      // Update day data
      const dayData = dreamData[dateStr];
      dayData.count += 1;
      
      // Average intensity and quality across dreams for the day
      dayData.intensity = (dayData.intensity * (dayData.count - 1) + intensity) / dayData.count;
      dayData.quality = (dayData.quality * (dayData.count - 1) + quality) / dayData.count;
      
      // Calculate weighted score (count * 0.4 + intensity * 0.3 + quality * 0.3)
      dayData.weightedScore = Math.min(
        (dayData.count * 0.4 + dayData.intensity * 0.3 + dayData.quality * 0.3) / 2,
        1
      );
      
    } catch (error) {
      console.warn(`processDreamsForHeatmapEnhanced: Error processing dream at index ${index}:`, dream.createdAt, error);
    }
  });

  return dreamData;
};

/**
 * DreamHeatmap component that displays dream activity in a calendar-style heatmap
 * Shows dream frequency over a specified number of days with color-coded intensity
 */
export const DreamHeatmap: React.FC<DreamHeatmapProps> = ({
  dreams,
  numberOfDays = 30,
  showLegend = true,
  compact = false
}) => {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Get today's date and create a list of past days
  const today = startOfToday();
  const days: Date[] = eachDayOfInterval({
    start: subDays(today, numberOfDays - 1),
    end: today,
  });

  // Generate enhanced dream data from the provided dreams
  const dreamData: DreamData = processDreamsForHeatmapEnhanced(dreams);

  // Calculate dimensions based on compact mode
  const boxSize = compact ? COMPACT_BOX_SIZE : DEFAULT_BOX_SIZE;
  const gap = compact ? COMPACT_GAP : DEFAULT_GAP;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Dream Activity Heatmap</h3>

      <div style={{
        ...styles.gridContainer,
        gap: `${gap}px`,
        maxWidth: compact ? '280px' : '420px'
      }}>
        {days.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayData = dreamData[dateStr] || { count: 0, intensity: 0, quality: 0, weightedScore: 0 };
          const backgroundColor = getShadingLevel(dayData);
          const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

          return (
            <div
              key={index}
              style={{
                ...styles.dayBox,
                width: `${boxSize}px`,
                height: `${boxSize}px`,
                backgroundColor,
                border: isToday ? '2px solid var(--text-primary)' : '1px solid var(--border-light)',
                transform: hoveredDay === dateStr ? 'scale(1.2)' : 'scale(1)',
                zIndex: hoveredDay === dateStr ? 10 : 1,
              }}
              onMouseEnter={() => setHoveredDay(dateStr)}
              onMouseLeave={() => setHoveredDay(null)}
              title={`${format(day, 'MMM dd, yyyy')}: ${dayData.count} ${dayData.count === 1 ? 'dream' : 'dreams'}${dayData.count > 0 ? ` (Intensity: ${Math.round(dayData.intensity * 100)}%, Quality: ${Math.round(dayData.quality * 100)}%)` : ''}`}
            >
              {!compact && (
                <>
                  <span style={styles.dateLabel}>{format(day, 'dd')}</span>
                  {dayData.count > 0 && (
                    <span style={styles.dreamCountLabel}>{dayData.count}</span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {showLegend && (
        <div style={styles.legend}>
          <span style={styles.legendText}>Less</span>
          <div style={styles.legendItems}>
            {[0, 0.2, 0.4, 0.6, 0.8].map((score) => (
              <div
                key={score}
                style={{
                  ...styles.legendItem,
                  backgroundColor: getShadingLevel({ count: score > 0 ? 1 : 0, intensity: 0, quality: 0, weightedScore: score }),
                  width: `${boxSize}px`,
                  height: `${boxSize}px`,
                }}
              />
            ))}
          </div>
          <span style={styles.legendText}>More</span>
        </div>
      )}
    </div>
  );
};

// Component styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: 'var(--surface-primary)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px var(--shadow-soft), 0 2px 4px -1px var(--shadow-soft)',
    border: '1px solid var(--border-light)',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '20px',
    marginTop: '0',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)', // 7 days per row
    margin: '0 auto',
    padding: '10px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
  },
  dayBox: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '3px',
    color: 'var(--text-secondary)',
    fontSize: '10px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    userSelect: 'none',
  },
  dateLabel: {
    fontWeight: '600',
    marginBottom: '1px',
    fontSize: '8px',
  },
  dreamCountLabel: {
    fontSize: '8px',
    fontWeight: '700',
    color: '#ffffff',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '20px',
    padding: '15px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
  },
  legendText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  legendItems: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  legendItem: {
    borderRadius: '2px',
    border: '1px solid var(--border-light)',
  },
};
