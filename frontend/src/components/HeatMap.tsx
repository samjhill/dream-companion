import React from 'react';
import { format, eachDayOfInterval, subDays, startOfToday } from 'date-fns';
import { processDreamsForHeatmap } from '../helpers/process-dreams';

// Define a type for the dream data
type DreamData = {
  [date: string]: number;
};

// Function to determine background color based on the number of dreams
const getShadingLevel = (dreamCount: number): string => {
  if (dreamCount === 0) return '#f0f0f0'; // Lightest color for no dreams
  if (dreamCount === 1) return '#c6e48b'; // Light green for one dream
  if (dreamCount === 2) return '#7bc96f'; // Mid green for two dreams
  if (dreamCount >= 3) return '#196127';  // Dark green for three or more dreams
  return '#f0f0f0'; // Default to light grey
};

// Define the component props type
interface DreamHeatmapProps {
  dreams: any;
  numberOfDays?: number;
}

export const DreamHeatmap: React.FC<DreamHeatmapProps> = ({ dreams, numberOfDays=30 }) => {
  // Get today's date and create a list of past days
  const today = startOfToday();
  const days: Date[] = eachDayOfInterval({
    start: subDays(today, numberOfDays - 1),
    end: today,
  });

  // Generate mock dream data (this should be replaced with actual API calls)
  const dreamData: DreamData = processDreamsForHeatmap(dreams);

  return (
    <div>
      <h3>Heatmap of Dream Activity</h3>
      <div style={styles.gridContainer}>
        {days.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dreamCount = dreamData[dateStr] || 0;
          const backgroundColor = getShadingLevel(dreamCount);

          return (
            <div key={index} style={{ ...styles.dayBox, backgroundColor }}>
              <span style={styles.dateLabel}>{format(day, 'MM/dd')}</span>
              <span style={styles.dreamCountLabel}>
                {dreamCount} {dreamCount === 1 ? 'dream' : 'dreams'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Styles for the component
const styles: { [key: string]: React.CSSProperties } = {
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)', // 7 days per row
    gap: '5px',
    marginTop: '20px',
    marginBottom: '20px',
    maxWidth: '420px'
  },
  dayBox: {
    width: '50px',
    height: '50px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '4px',
    color: '#333',
    fontSize: '12px',
    transition: 'all .5s ease-out'
  },
  dateLabel: {
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  dreamCountLabel: {
    fontSize: '10px',
  },
};
