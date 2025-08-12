import React, { useState } from 'react';
import { format, eachDayOfInterval, subDays, startOfToday } from 'date-fns';
import { processDreamsForHeatmap } from '../helpers/process-dreams';

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
}

/**
 * Type for mapping dates to dream counts
 */
type DreamData = {
  [date: string]: number;
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
 * Determines the background color based on the number of dreams
 * Uses a green color scale similar to GitHub's contribution graph
 */
const getShadingLevel = (dreamCount: number): string => {
  if (dreamCount === 0) return SHADING_LEVELS.NO_DREAMS;
  if (dreamCount === 1) return SHADING_LEVELS.ONE_DREAM;
  if (dreamCount === 2) return SHADING_LEVELS.TWO_DREAMS;
  if (dreamCount === 3) return SHADING_LEVELS.THREE_DREAMS;
  if (dreamCount >= 4) return SHADING_LEVELS.FOUR_PLUS_DREAMS;
  return SHADING_LEVELS.NO_DREAMS;
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

  // Generate dream data from the provided dreams
  const dreamData: DreamData = processDreamsForHeatmap(dreams);

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
          const dreamCount = dreamData[dateStr] || 0;
          const backgroundColor = getShadingLevel(dreamCount);
          const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

          return (
            <div
              key={index}
              style={{
                ...styles.dayBox,
                width: `${boxSize}px`,
                height: `${boxSize}px`,
                backgroundColor,
                border: isToday ? '2px solid #1f2937' : '1px solid #e5e7eb',
                transform: hoveredDay === dateStr ? 'scale(1.2)' : 'scale(1)',
                zIndex: hoveredDay === dateStr ? 10 : 1,
              }}
              onMouseEnter={() => setHoveredDay(dateStr)}
              onMouseLeave={() => setHoveredDay(null)}
              title={`${format(day, 'MMM dd, yyyy')}: ${dreamCount} ${dreamCount === 1 ? 'dream' : 'dreams'}`}
            >
              {!compact && (
                <>
                  <span style={styles.dateLabel}>{format(day, 'dd')}</span>
                  {dreamCount > 0 && (
                    <span style={styles.dreamCountLabel}>{dreamCount}</span>
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
            {[0, 1, 2, 3, 4].map((count) => (
              <div
                key={count}
                style={{
                  ...styles.legendItem,
                  backgroundColor: getShadingLevel(count),
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
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
    marginTop: '0',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)', // 7 days per row
    margin: '0 auto',
    padding: '10px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  dayBox: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '3px',
    color: '#374151',
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
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  legendText: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  legendItems: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  legendItem: {
    borderRadius: '2px',
    border: '1px solid #d1d5db',
  },
};
