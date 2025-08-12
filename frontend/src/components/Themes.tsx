import { fetchAuthSession } from "aws-amplify/auth";
import React, { useEffect, useState } from "react";
import { getUserPhoneNumber } from "../helpers/user";

const THEME_GREETINGS = [
    "After learning more about your dream patterns, I've identified some recurring themes, along with actionable steps you can take to address them in your daily life.",
    "Now that we've explored your dreams in more depth, here are the key patterns I've noticed, along with specific actions you can take to work on them while you're awake.",
    "From our time together, I've recognized certain patterns in your dreams and have some practical advice for how to approach them in your waking hours.",
    "Having spent some time analyzing your dreams, I've identified some recurring themes, and here are some real-life strategies to work through them.",
    "Based on the dream patterns I've observed, I have a few suggestions and practical tasks you can do to engage with them in your daily life."
];

const API_BASE_URL = "https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod";

export const Themes: React.FC = () => {
    const [randomNumber, setRandomNumber] = useState<number>(0);
    const [themes, setThemes] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchThemes = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const session = await fetchAuthSession();
            const phoneNumber = await getUserPhoneNumber();
            
            if (!phoneNumber) {
                setError("No phone number found. Please check your profile settings.");
                return;
            }
            
            const response = await fetch(
                `${API_BASE_URL}/api/themes/${phoneNumber.replace("+", "")}`,
                { headers: { 'Authorization': `Bearer ${session?.tokens?.accessToken}` } }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch themes: ${response.status}`);
            }
            
            const data = await response.text();
            setThemes(data);
        } catch (error) {
            console.error("Error fetching themes:", error);
            setError("Failed to load themes. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        window.location.reload();
    };

    useEffect(() => {
        fetchThemes();
        setRandomNumber(Math.floor(Math.random() * THEME_GREETINGS.length));
    }, []);

    if (loading) {
        return (
            <div className="themes-section">
                <div className="section-header">
                    <h2>Dream Themes</h2>
                    <p className="text-muted">Loading your themes...</p>
                </div>
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="themes-section">
                <div className="section-header">
                    <h2>Dream Themes</h2>
                </div>
                <div className="error-message">
                    <p>{error}</p>
                    <button 
                        className="btn btn-primary"
                        onClick={handleRetry}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!themes) {
        return (
            <div className="themes-section">
                <div className="section-header">
                    <h2>Dream Themes</h2>
                </div>
                <div className="empty-state">
                    <div className="empty-icon">🎨</div>
                    <h3>No themes available yet</h3>
                    <p className="text-muted">
                        Themes will appear here once you have more dreams recorded.
                    </p>
                </div>
            </div>
        );
    }

    const themeList = themes
        .replace(/- /g, "")
        .split("\n")
        .map(theme => {
            const parts = theme.split(":");
            return { theme: parts[0], task: parts[1] };
        })
        .filter(item => item.theme && item.task);

    return (
        <div className="themes-section">
            <div className="section-header">
                <h2>Dream Themes</h2>
                <p className="theme-intro">{THEME_GREETINGS[randomNumber]}</p>
            </div>
            
            <div className="themes-content">
                <ul className="themes-list">
                    {themeList.map((item, index) => (
                        <li key={index} className="theme-card">
                            <div className="theme-header">
                                <h3 className="theme-title">{item.theme}</h3>
                            </div>
                            <p className="theme-task">{item.task}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};