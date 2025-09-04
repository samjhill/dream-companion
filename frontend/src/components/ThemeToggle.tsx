import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-icon">
        {isDark ? '☀️' : '🌙'}
      </div>
      <span className="theme-toggle-label">
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
};
