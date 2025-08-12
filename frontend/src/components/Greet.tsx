import React, { useEffect, useState } from "react";
import OwlStandard from "../assets/clara-owl-standard.jpg";
import OwlOverjoyed from "../assets/clara-owl-overjoyed.jpg";
import OwlSleepy from "../assets/clara-owl-thinking.jpg";
import OwlThinking from "../assets/clara-owl-thinking.jpg";

const GREETINGS = [
    "Welcome back! Ready to dive deeper into your dreams and uncover new insights?",
    "Hello again! Let's explore the patterns in your dreams and what they reveal.",
    "Welcome! Ready to continue your journey of self-discovery through your dreams?",
    "Hi there! Let's get started on unlocking the secrets hidden in your dreams today.",
    "Good to see you! Let's dive into your dream world and see what new insights await.",
    "Welcome! Your dreams are waiting to be explored—let's take a look together.",
    "Hello! Let's unlock the deeper meaning behind your dreams and find clarity.",
    "Welcome back! It's time to uncover the messages hidden within your dreams.",
    "Hey there! Ready to unravel the mysteries of your dreams and make sense of them?",
    "Glad to have you here! Let's see what your dreams have to share with you today.",
    "Hi! Are you ready to dive into your dreams and discover the hidden truths within?",
    "Hello! It's time to explore your dreams and gain fresh insights for your waking life.",
    "Welcome back to your dream journey! Let's uncover some new patterns together.",
    "Good to see you again! Let's explore your dreams and what they're trying to tell you.",
    "Hello! Your dream patterns hold powerful messages—let's dive in and explore them.",
    "Welcome back! Let's discover the deeper meanings behind the dreams you've had.",
    "Hi! Ready to unlock the wisdom that's been hiding in your dreams?",
    "Hello again! Let's start exploring what your dreams can teach you today.",
    "Welcome! Let's begin the journey of decoding your dreams and finding new insights.",
    "Hey there! Let's continue your dream exploration and uncover what lies within."
];

const OWL_IMAGES = [OwlStandard, OwlOverjoyed, OwlSleepy, OwlThinking];

export const Greet: React.FC = () => {
    const [randomNumber, setRandomNumber] = useState<number>(0);
    const [randomGreeting, setRandomGreeting] = useState<string>("");

    useEffect(() => {
        setRandomNumber(Math.floor(Math.random() * OWL_IMAGES.length));
        setRandomGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    }, []);

    const randomImage = OWL_IMAGES[randomNumber];
    const greetingParts = randomGreeting.split("!");

    return (
        <div className="greet-section">
            <div className="greet-content">
                <img 
                    src={randomImage} 
                    alt="Clara the owl - your dream guide" 
                    className="profile-pic"
                />
                
                <div className="greeting-text">
                    <p className="greeting-main">
                        <strong>{greetingParts[0]}!</strong>
                        {greetingParts[1]}
                    </p>
                </div>
            </div>
        </div>
    );
};