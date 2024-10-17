import React, { useEffect, useState } from "react";
import OwlStandard from "../assets/clara-owl-standard.jpg";
import OwlOverjoyed from "../assets/clara-owl-overjoyed.jpg";
import OwlSleepy from "../assets/clara-owl-sleepy.jpg";
import { generateRandomNumber } from "../helpers/numbers";

const greetings = [
    "Welcome back! Ready to dive deeper into your dreams and uncover new insights?",
    "Hello again! Let's explore the patterns in your dreams and what they reveal.",
    "Welcome! Ready to continue your journey of self-discovery through your dreams?",
    "Hi there! Let’s get started on unlocking the secrets hidden in your dreams today.",
    "Good to see you! Let’s dive into your dream world and see what new insights await.",
    "Welcome! Your dreams are waiting to be explored—let’s take a look together.",
    "Hello! Let’s unlock the deeper meaning behind your dreams and find clarity.",
    "Welcome back! It’s time to uncover the messages hidden within your dreams.",
    "Hey there! Ready to unravel the mysteries of your dreams and make sense of them?",
    "Glad to have you here! Let’s see what your dreams have to share with you today.",
    "Hi! Are you ready to dive into your dreams and discover the hidden truths within?",
    "Hello! It’s time to explore your dreams and gain fresh insights for your waking life.",
    "Welcome back to your dream journey! Let’s uncover some new patterns together.",
    "Good to see you again! Let’s explore your dreams and what they’re trying to tell you.",
    "Hello! Your dream patterns hold powerful messages—let’s dive in and explore them.",
    "Welcome back! Let’s discover the deeper meanings behind the dreams you've had.",
    "Hi! Ready to unlock the wisdom that’s been hiding in your dreams?",
    "Hello again! Let’s start exploring what your dreams can teach you today.",
    "Welcome! Let’s begin the journey of decoding your dreams and finding new insights.",
    "Hey there! Let’s continue your dream exploration and uncover what lies within."
];

export const Greet: React.FC = () => {
    const imageOptions = [OwlStandard, OwlOverjoyed, OwlSleepy];
    const [randomNumber, setRandomNumber] = useState<number>(0);
    const [randomGreeting, setRandomGreeting] = useState<string>("");

    useEffect(() => {
        setRandomNumber(generateRandomNumber(imageOptions.length));
        setRandomGreeting(greetings[generateRandomNumber(greetings.length)]);
    }, []);

    const randomImage = imageOptions[randomNumber];

    return (
        <div className="greet-section">
        <div style={{display: "flex"}}>
        
        <img src={randomImage} className="profile-pic" />
        
        </div>
        <p><strong>{randomGreeting.split("!")[0]}</strong>! {randomGreeting.split("!")[1]}</p>
        </div>
    )
}