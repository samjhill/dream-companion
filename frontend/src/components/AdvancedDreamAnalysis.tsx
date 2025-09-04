import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUserPhoneNumber } from '../helpers/user';
import { PremiumGate } from './PremiumGate';

interface ArchetypeAnalysis {
  archetypes_found: string[];
  archetype_details: Record<string, {
    meaning: string;
    positive_aspects: string;
    negative_aspects: string;
    appearances: Array<{
      date: string;
      context: string;
    }>;
  }>;
  recommendations: string[];
}

interface PatternAnalysis {
  recurring_themes: {
    count: number;
    themes: Record<string, number>;
  };
  emotional_patterns: {
    distribution: Record<string, number>;
    dominant_emotion: string;
  };
  insights: string[];
}

interface AdvancedAnalysis {
  total_dreams: number;
  analysis_date: string;
  archetype_analysis: {
    total_archetypes_found: number;
    most_common_archetypes: [string, number][];
    archetype_details: Record<string, any>;
  };
  emotional_patterns: {
    dominant_emotions: [string, number][];
    emotional_intensity_trend: {
      average_intensity: number;
      intensity_range: {
        min: number;
        max: number;
      };
    };
    emotional_stability: string;
  };
  temporal_patterns: {
    time_related_dreams_count: number;
    temporal_distribution: {
      past: number;
      present: number;
      future: number;
    };
    time_related_dreams: Array<{
      date: string;
      time_period: string;
      content: string;
    }>;
  };
  symbol_evolution: {
    symbols_tracked: number;
    symbol_evolution: Record<string, any>;
    most_evolving_symbols: [string, any][];
  };
  personal_insights: string[];
  recommendations: string[];
}

const API_BASE_URL = "https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod";

export const AdvancedDreamAnalysis: React.FC = () => {
  const [analysis, setAnalysis] = useState<AdvancedAnalysis | null>(null);
  const [archetypeAnalysis, setArchetypeAnalysis] = useState<ArchetypeAnalysis | null>(null);
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'archetypes' | 'patterns'>('overview');

  useEffect(() => {
    fetchAdvancedAnalysis();
  }, []);

  const fetchAdvancedAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await fetchAuthSession();
      const phoneNumber = await getUserPhoneNumber();

      if (!phoneNumber) {
        setError("No phone number found. Please check your profile settings.");
        return;
      }

      // Fetch comprehensive analysis
      const [analysisResponse, archetypeResponse, patternResponse] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/analysis/advanced/${phoneNumber.replace("+", "")}`,
          { headers: { 'Authorization': `Bearer ${session?.tokens?.accessToken}` } }
        ),
        fetch(
          `${API_BASE_URL}/api/analysis/archetypes/${phoneNumber.replace("+", "")}`,
          { headers: { 'Authorization': `Bearer ${session?.tokens?.accessToken}` } }
        ),
        fetch(
          `${API_BASE_URL}/api/analysis/patterns/${phoneNumber.replace("+", "")}`,
          { headers: { 'Authorization': `Bearer ${session?.tokens?.accessToken}` } }
        )
      ]);

      // Check for premium access errors
      if (analysisResponse.status === 403 || archetypeResponse.status === 403 || patternResponse.status === 403) {
        const errorData = await analysisResponse.json();
        setError(errorData.message || "Premium subscription required for advanced analysis");
        return;
      }

      if (!analysisResponse.ok || !archetypeResponse.ok || !patternResponse.ok) {
        throw new Error('Failed to fetch analysis data');
      }

      const [analysisData, archetypeData, patternData] = await Promise.all([
        analysisResponse.json(),
        archetypeResponse.json(),
        patternResponse.json()
      ]);

      setAnalysis(analysisData);
      setArchetypeAnalysis(archetypeData);
      setPatternAnalysis(patternData);

    } catch (error) {
      console.error("Error fetching advanced analysis:", error);
      setError("Failed to load advanced analysis. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getEmotionalStabilityLabel = (stability: string) => {
    switch (stability) {
      case 'emotionally_balanced':
        return 'Emotionally Balanced';
      case 'moderately_stable':
        return 'Moderately Stable';
      case 'emotionally_focused':
        return 'Emotionally Focused';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="advanced-dream-analysis">
        <div className="section-header">
          <h2>Advanced Dream Analysis</h2>
          <p className="text-muted">Analyzing your dreams...</p>
        </div>
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="advanced-dream-analysis">
        <div className="section-header">
          <h2>Advanced Dream Analysis</h2>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={fetchAdvancedAnalysis}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <PremiumGate feature="Advanced Dream Analysis">
      <div className="advanced-dream-analysis">
        <div className="section-header">
          <h2>Advanced Dream Analysis</h2>
          <p className="text-muted">
            Deep insights into your dream patterns and psychological landscape
          </p>
        </div>

      {/* Analysis Summary */}
      {analysis && (
        <div className="analysis-summary">
          <div className="summary-card">
            <div className="summary-header">
              <h3>📊 Analysis Overview</h3>
              <span className="analysis-date">
                {formatDate(analysis.analysis_date)}
              </span>
            </div>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-number">{analysis.total_dreams}</span>
                <span className="stat-label">Total Dreams</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{analysis.archetype_analysis.total_archetypes_found}</span>
                <span className="stat-label">Archetypes Found</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{analysis.temporal_patterns.time_related_dreams_count}</span>
                <span className="stat-label">Time-Related Dreams</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{analysis.symbol_evolution.symbols_tracked}</span>
                <span className="stat-label">Symbols Tracked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="analysis-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'archetypes' ? 'active' : ''}`}
          onClick={() => setActiveTab('archetypes')}
        >
          Archetypes
        </button>
        <button
          className={`tab-button ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          Patterns
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && analysis && (
          <div className="overview-tab">
            {/* Emotional Patterns */}
            <div className="analysis-section">
              <h3>🧠 Emotional Patterns</h3>
              <div className="emotional-patterns">
                <div className="pattern-card">
                  <h4>Dominant Emotions</h4>
                  <div className="emotion-list">
                    {analysis.emotional_patterns.dominant_emotions.map(([emotion, count], index) => (
                      <div key={index} className="emotion-item">
                        <span className="emotion-name">{emotion}</span>
                        <span className="emotion-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pattern-card">
                  <h4>Emotional Stability</h4>
                  <p className="stability-label">
                    {getEmotionalStabilityLabel(analysis.emotional_patterns.emotional_stability)}
                  </p>
                  <div className="intensity-info">
                    <p>Average Intensity: {(analysis.emotional_patterns.emotional_intensity_trend.average_intensity * 100).toFixed(1)}%</p>
                    <p>Range: {(analysis.emotional_patterns.emotional_intensity_trend.intensity_range.min * 100).toFixed(1)}% - {(analysis.emotional_patterns.emotional_intensity_trend.intensity_range.max * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Temporal Patterns */}
            <div className="analysis-section">
              <h3>⏰ Temporal Patterns</h3>
              <div className="temporal-patterns">
                <div className="pattern-card">
                  <h4>Time Distribution</h4>
                  <div className="time-distribution">
                    <div className="time-item">
                      <span className="time-label">Past</span>
                      <span className="time-count">{analysis.temporal_patterns.temporal_distribution.past}</span>
                    </div>
                    <div className="time-item">
                      <span className="time-label">Present</span>
                      <span className="time-count">{analysis.temporal_patterns.temporal_distribution.present}</span>
                    </div>
                    <div className="time-item">
                      <span className="time-label">Future</span>
                      <span className="time-count">{analysis.temporal_patterns.temporal_distribution.future}</span>
                    </div>
                  </div>
                </div>

                <div className="pattern-card">
                  <h4>Recent Time-Related Dreams</h4>
                  <div className="time-dreams-list">
                    {analysis.temporal_patterns.time_related_dreams.slice(0, 5).map((dream, index) => (
                      <div key={index} className="time-dream-item">
                        <span className="dream-date">{formatDate(dream.date)}</span>
                        <span className="dream-period">{dream.time_period}</span>
                        <p className="dream-content">{dream.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Symbol Evolution */}
            <div className="analysis-section">
              <h3>🔄 Symbol Evolution</h3>
              <div className="symbol-evolution">
                <div className="pattern-card">
                  <h4>Most Evolving Symbols</h4>
                  <div className="evolving-symbols">
                    {analysis.symbol_evolution.most_evolving_symbols.slice(0, 5).map(([symbol, data], index) => (
                      <div key={index} className="symbol-item">
                        <span className="symbol-name">{symbol}</span>
                        <span className="symbol-evolution-count">{data.length} appearances</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Insights */}
            <div className="analysis-section">
              <h3>💡 Personal Insights</h3>
              <div className="insights-list">
                {analysis.personal_insights.map((insight, index) => (
                  <div key={index} className="insight-item">
                    <span className="insight-icon">💭</span>
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="analysis-section">
              <h3>🎯 Recommendations</h3>
              <div className="recommendations-list">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="recommendation-item">
                    <span className="recommendation-icon">✨</span>
                    <p>{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'archetypes' && archetypeAnalysis && (
          <div className="archetypes-tab">
            <div className="analysis-section">
              <h3>🏛️ Dream Archetypes</h3>
              <p className="section-description">
                Archetypes are universal dream symbols that carry deep psychological meaning.
              </p>

              {archetypeAnalysis.archetypes_found.length > 0 ? (
                <div className="archetypes-grid">
                  {archetypeAnalysis.archetypes_found.map((archetype) => {
                    const details = archetypeAnalysis.archetype_details[archetype];
                    return (
                      <div key={archetype} className="archetype-card">
                        <div className="archetype-header">
                          <h4>{archetype.charAt(0).toUpperCase() + archetype.slice(1)}</h4>
                          <span className="appearance-count">
                            {details.appearances.length} appearance{details.appearances.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="archetype-meaning">
                          <h5>Meaning</h5>
                          <p>{details.meaning}</p>
                        </div>

                        <div className="archetype-aspects">
                          <div className="aspect positive">
                            <h5>Positive Aspects</h5>
                            <p>{details.positive_aspects}</p>
                          </div>
                          <div className="aspect negative">
                            <h5>Challenging Aspects</h5>
                            <p>{details.negative_aspects}</p>
                          </div>
                        </div>

                        <div className="archetype-appearances">
                          <h5>Recent Appearances</h5>
                          <div className="appearances-list">
                            {details.appearances.slice(0, 3).map((appearance, index) => (
                              <div key={index} className="appearance-item">
                                <span className="appearance-date">{formatDate(appearance.date)}</span>
                                <p className="appearance-context">{appearance.context}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-archetypes">
                  <p>No archetypes found in your recent dreams. Continue journaling to discover patterns!</p>
                </div>
              )}

              {archetypeAnalysis.recommendations.length > 0 && (
                <div className="archetype-recommendations">
                  <h4>Archetype-Based Recommendations</h4>
                  <div className="recommendations-list">
                    {archetypeAnalysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="recommendation-item">
                        <span className="recommendation-icon">💡</span>
                        <p>{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'patterns' && patternAnalysis && (
          <div className="patterns-tab">
            <div className="analysis-section">
              <h3>📈 Psychological Patterns</h3>
              <p className="section-description">
                Discover recurring themes and emotional patterns in your dream life.
              </p>

              {/* Recurring Themes */}
              <div className="pattern-section">
                <h4>🔄 Recurring Themes</h4>
                <div className="themes-analysis">
                  <div className="pattern-card">
                    <h5>Theme Summary</h5>
                    <p>Found {patternAnalysis.recurring_themes.count} recurring themes across your dreams.</p>

                    {patternAnalysis.recurring_themes.count > 0 && (
                      <div className="themes-list">
                        <h6>Most Common Themes:</h6>
                        <div className="theme-items">
                          {Object.entries(patternAnalysis.recurring_themes.themes)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 10)
                            .map(([theme, count]) => (
                              <div key={theme} className="theme-item">
                                <span className="theme-name">{theme}</span>
                                <span className="theme-count">{count}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Emotional Patterns */}
              <div className="pattern-section">
                <h4>😊 Emotional Patterns</h4>
                <div className="emotional-analysis">
                  <div className="pattern-card">
                    <h5>Emotional Distribution</h5>
                    <div className="emotion-distribution">
                      {Object.entries(patternAnalysis.emotional_patterns.distribution).map(([emotion, count]) => (
                        <div key={emotion} className="emotion-distribution-item">
                          <span className="emotion-name">{emotion}</span>
                          <div className="emotion-bar">
                            <div
                              className="emotion-fill"
                              style={{ width: `${(count / Math.max(...Object.values(patternAnalysis.emotional_patterns.distribution))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="emotion-count">{count}</span>
                        </div>
                      ))}
                    </div>
                    <p><strong>Dominant Emotion:</strong> {patternAnalysis.emotional_patterns.dominant_emotion}</p>
                  </div>
                </div>
              </div>

              {/* Insights */}
              {patternAnalysis.insights.length > 0 && (
                <div className="pattern-section">
                  <h4>💭 Pattern Insights</h4>
                  <div className="insights-list">
                    {patternAnalysis.insights.map((insight, index) => (
                      <div key={index} className="insight-item">
                        <span className="insight-icon">💭</span>
                        <p>{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </PremiumGate>
  );
};
