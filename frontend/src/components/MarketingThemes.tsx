import React from 'react';

const SAMPLE_THEMES = [
    {
        theme: "Flying Dreams",
        task: "Practice mindfulness exercises to feel more in control of your life circumstances."
    },
    {
        theme: "Being Chased",
        task: "Identify what you're avoiding in your waking life and create a plan to address it."
    },
    {
        theme: "Falling",
        task: "Focus on building stability in your daily routine and relationships."
    },
    {
        theme: "Water & Swimming",
        task: "Explore your emotional depth through journaling or creative expression."
    },
    {
        theme: "House Exploration",
        task: "Reflect on different aspects of your personality and how they work together."
    },
    {
        theme: "Teeth Falling Out",
        task: "Work on communication skills and expressing your true feelings to others."
    }
];

const THEME_GREETINGS = [
    "Discover recurring themes in your dreams and get practical guidance to explore your inner world.",
    "Unlock the patterns hidden in your dreams with actionable insights for personal growth.",
    "Learn to recognize dream themes and receive practical steps to work through them in your daily life.",
    "Transform your dream patterns into personal development opportunities with guided reflection."
];

export const MarketingThemes: React.FC = () => {
    // Use a stable greeting instead of random to avoid unnecessary re-renders
    const greeting = THEME_GREETINGS[0];

    return (
        <div className="marketing-themes-section">
            <div className="themes-content">
                <p className="theme-intro">{greeting}</p>

                <div className="themes-grid">
                    {SAMPLE_THEMES.map((item, index) => (
                        <div key={index} className="theme-card">
                            <div className="theme-header">
                                <h3 className="theme-title">{item.theme}</h3>
                            </div>
                            <p className="theme-task">{item.task}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
