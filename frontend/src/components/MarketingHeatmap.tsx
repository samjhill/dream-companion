import React from 'react';
import { DreamHeatmap } from './HeatMap';

// Sample dream data for marketing purposes
const sampleDreams = [
  { createdAt: '2024-12-01T08:00:00Z' },
  { createdAt: '2024-12-02T07:30:00Z' },
  { createdAt: '2024-12-02T09:15:00Z' },
  { createdAt: '2024-12-04T06:45:00Z' },
  { createdAt: '2024-12-05T08:20:00Z' },
  { createdAt: '2024-12-05T10:00:00Z' },
  { createdAt: '2024-12-05T11:30:00Z' },
  { createdAt: '2024-12-07T07:00:00Z' },
  { createdAt: '2024-12-08T08:45:00Z' },
  { createdAt: '2024-12-09T06:30:00Z' },
  { createdAt: '2024-12-09T09:20:00Z' },
  { createdAt: '2024-12-10T07:15:00Z' },
  { createdAt: '2024-12-11T08:00:00Z' },
  { createdAt: '2024-12-12T06:45:00Z' },
  { createdAt: '2024-12-12T08:30:00Z' },
  { createdAt: '2024-12-12T10:15:00Z' },
  { createdAt: '2024-12-13T07:00:00Z' },
  { createdAt: '2024-12-14T08:45:00Z' },
  { createdAt: '2024-12-15T06:30:00Z' },
  { createdAt: '2024-12-16T07:15:00Z' },
  { createdAt: '2024-12-17T08:00:00Z' },
  { createdAt: '2024-12-17T09:45:00Z' },
  { createdAt: '2024-12-18T07:30:00Z' },
  { createdAt: '2024-12-19T08:15:00Z' },
  { createdAt: '2024-12-20T06:00:00Z' },
  { createdAt: '2024-12-20T07:45:00Z' },
  { createdAt: '2024-12-20T09:30:00Z' },
  { createdAt: '2024-12-21T08:00:00Z' },
  { createdAt: '2024-12-22T07:15:00Z' },
  { createdAt: '2024-12-23T08:30:00Z' },
  { createdAt: '2024-12-24T07:00:00Z' },
  { createdAt: '2024-12-24T08:45:00Z' },
  { createdAt: '2024-12-25T06:30:00Z' },
  { createdAt: '2024-12-26T07:15:00Z' },
  { createdAt: '2024-12-27T08:00:00Z' },
  { createdAt: '2024-12-28T07:45:00Z' },
  { createdAt: '2024-12-29T08:30:00Z' },
  { createdAt: '2024-12-30T07:00:00Z' },
];

export const MarketingHeatmap: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h3 style={styles.title}>Your Dream Journey</h3>
        <p style={styles.description}>
          Track your dreams over time and discover patterns in your subconscious mind
        </p>
        
        <div style={styles.heatmapWrapper}>
          <DreamHeatmap 
            dreams={sampleDreams} 
            numberOfDays={30}
            showLegend={true}
            compact={false}
          />
        </div>
        
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>30</span>
            <span style={styles.statLabel}>Days Tracked</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>35</span>
            <span style={styles.statLabel}>Dreams Logged</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>1.2</span>
            <span style={styles.statLabel}>Avg/Day</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    margin: '2rem 0',
  },
  content: {
    padding: '2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 0.5rem 0',
  },
  description: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0 0 2rem 0',
    lineHeight: '1.5',
  },
  heatmapWrapper: {
    margin: '0 auto',
    maxWidth: 'fit-content',
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500',
  },
};
