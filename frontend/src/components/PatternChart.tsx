import React from 'react';
import './PatternChart.css';

interface PatternData {
  frequency: number;
  first_seen: string;
  last_seen: string;
}

interface PatternChartProps {
  patterns: Record<string, PatternData>;
  type: 'symbols' | 'themes' | 'emotions';
  showTrend?: boolean;
}

export const PatternChart: React.FC<PatternChartProps> = ({
  patterns,
  type,
  showTrend = false
}) => {
  // Removed unused getTypeColor function

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'symbols':
        return '🔍';
      case 'themes':
        return '🎨';
      case 'emotions':
        return '💭';
      default:
        return '📊';
    }
  };

  const sortedPatterns = Object.entries(patterns)
    .sort(([, a], [, b]) => b.frequency - a.frequency)
    .slice(0, 10); // Show top 10 patterns

  const maxFrequency = Math.max(...sortedPatterns.map(([, data]) => data.frequency));

  const getBarWidth = (frequency: number) => {
    return `${(frequency / maxFrequency) * 100}%`;
  };

  const getFrequencyColor = (frequency: number) => {
    const intensity = frequency / maxFrequency;
    if (intensity > 0.8) return '#ff4444';
    if (intensity > 0.6) return '#ffaa00';
    if (intensity > 0.4) return '#44ff44';
    return '#666';
  };

  if (sortedPatterns.length === 0) {
    return (
      <div className="pattern-chart">
        <div className="chart-header">
          <h4>
            <span className="type-icon">{getTypeIcon(type)}</span>
            {type.charAt(0).toUpperCase() + type.slice(1)} Patterns
          </h4>
        </div>
        <div className="empty-patterns">
          <p>No {type} patterns found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pattern-chart">
      <div className="chart-header">
        <h4>
          <span className="type-icon">{getTypeIcon(type)}</span>
          {type.charAt(0).toUpperCase() + type.slice(1)} Patterns
        </h4>
        <div className="chart-stats">
          <span className="total-patterns">{sortedPatterns.length} patterns</span>
          <span className="max-frequency">Max: {maxFrequency}x</span>
        </div>
      </div>

      <div className="chart-content">
        <div className="patterns-list">
          {sortedPatterns.map(([name, data]) => (
            <div key={name} className="pattern-item">
              <div className="pattern-info">
                <div className="pattern-name">{name}</div>
                <div className="pattern-dates">
                  <span className="first-seen">
                    First: {new Date(data.first_seen).toLocaleDateString()}
                  </span>
                  <span className="last-seen">
                    Last: {new Date(data.last_seen).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="pattern-visualization">
                <div className="frequency-bar">
                  <div
                    className="frequency-fill"
                    style={{
                      width: getBarWidth(data.frequency),
                      backgroundColor: getFrequencyColor(data.frequency)
                    }}
                  />
                </div>
                <div className="frequency-count">
                  {data.frequency}x
                </div>
              </div>
            </div>
          ))}
        </div>

        {showTrend && (
          <div className="trend-analysis">
            <h5>Trend Analysis</h5>
            <div className="trend-stats">
              <div className="trend-stat">
                <span className="trend-label">Most Common:</span>
                <span className="trend-value">
                  {sortedPatterns[0]?.[0]} ({sortedPatterns[0]?.[1].frequency}x)
                </span>
              </div>
              <div className="trend-stat">
                <span className="trend-label">Average Frequency:</span>
                <span className="trend-value">
                  {(sortedPatterns.reduce((sum, [, data]) => sum + data.frequency, 0) / sortedPatterns.length).toFixed(1)}x
                </span>
              </div>
              <div className="trend-stat">
                <span className="trend-label">Pattern Diversity:</span>
                <span className="trend-value">
                  {sortedPatterns.length} unique patterns
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
