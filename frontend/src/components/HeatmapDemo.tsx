import React from 'react';
import { DreamHeatmap } from './HeatMap';

// Function to generate demo dreams within the last 30 days
const generateDemoDreams = () => {
  const dreams = [];
  const now = new Date();
  
  // Generate 12-15 dreams randomly distributed over the last 30 days
  const numberOfDreams = Math.floor(Math.random() * 4) + 12; // 12-15 dreams
  
  for (let i = 0; i < numberOfDreams; i++) {
    // Random date within last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    // Random time between 6 AM and 11 PM
    const hours = Math.floor(Math.random() * 18) + 6; // 6-23 (6 AM - 11 PM)
    const minutes = Math.floor(Math.random() * 60);
    
    date.setHours(hours, minutes, 0, 0);
    
    dreams.push({
      createdAt: date.toISOString()
    });
  }
  
  // Sort by date (newest first)
  return dreams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Styles matching the HeatMap component
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
    marginTop: '0',
  },
  subtitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '15px',
    marginTop: '30px',
  },
  description: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  section: {
    marginBottom: '40px',
  },
};

export const HeatmapDemo: React.FC = () => {
  // Generate fresh demo data on each render
  const demoDreams = generateDemoDreams();
  
  return (
      <DreamHeatmap dreams={demoDreams} numberOfDays={30} />
  );
};
