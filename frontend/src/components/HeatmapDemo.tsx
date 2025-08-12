import React from 'react';
import { DreamHeatmap } from './HeatMap';

const demoDreams = [
  { createdAt: '2024-12-01T08:00:00Z' },
  { createdAt: '2024-12-02T07:30:00Z' },
  { createdAt: '2024-12-02T09:15:00Z' },
  { createdAt: '2024-12-05T08:20:00Z' },
  { createdAt: '2024-12-05T10:00:00Z' },
  { createdAt: '2024-12-05T11:30:00Z' },
  { createdAt: '2024-12-12T06:45:00Z' },
  { createdAt: '2024-12-12T08:30:00Z' },
  { createdAt: '2024-12-12T10:15:00Z' },
  { createdAt: '2024-12-20T06:00:00Z' },
  { createdAt: '2024-12-20T07:45:00Z' },
  { createdAt: '2024-12-20T09:30:00Z' },
];

export const HeatmapDemo: React.FC = () => (
  <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
    <h2>Heatmap Component Demo</h2>
    
    <h3>Standard View (30 days)</h3>
    <DreamHeatmap dreams={demoDreams} numberOfDays={30} />
    
    <h3>Compact View (90 days)</h3>
    <DreamHeatmap dreams={demoDreams} numberOfDays={90} compact={true} />
    
    <h3>Without Legend (7 days)</h3>
    <DreamHeatmap dreams={demoDreams} numberOfDays={7} showLegend={false} />
  </div>
);
