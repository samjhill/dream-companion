import { fetchAuthSession } from "aws-amplify/auth";
import React, { useEffect, useState } from "react";
import { getUserPhoneNumber } from "../helpers/user";
import { generateRandomNumber } from "../helpers/numbers";

const themeGreetings = [
    "After learning more about your dream patterns, I've identified some recurring themes, along with actionable steps you can take to address them in your daily life.",
    "Now that we've explored your dreams in more depth, here are the key patterns I’ve noticed, along with specific actions you can take to work on them while you're awake.",
    "From our time together, I’ve recognized certain patterns in your dreams and have some practical advice for how to approach them in your waking hours.",
    "Having spent some time analyzing your dreams, I’ve identified some recurring themes, and here are some real-life strategies to work through them.",
    "Based on the dream patterns I’ve observed, I have a few suggestions and practical tasks you can do to engage with them in your daily life."
];

export const Themes: React.FC = () => {
    const [randomNumber, setRandomNumber] = useState<number>(0);
    const [themes, setThemes] = useState<string>("");

    useEffect(() => {
        const fetchThemes = async () => {
            const session = await fetchAuthSession();
            const phoneNumber = await getUserPhoneNumber();
            if (!phoneNumber) {
                console.error("No phone number");
                return;
            }
            const url = "https://api.clarasdreamguide.com";
            const response = await fetch(`${url}/api/themes/${phoneNumber.replace("+", "")}`,
                { headers: { 'Authorization': `Bearer ${session?.tokens?.accessToken}` } }
            );
            const data = await response.text();
            console.log(data)
            setThemes(data);
        }

        fetchThemes();
        setRandomNumber(generateRandomNumber(themeGreetings.length));
    }, []);

    if (!themes) {
        return null;
    }

    return (
        <>
            <h2>Themes</h2>
            <p>{themeGreetings[randomNumber]}</p>
            <ul>
                {themes.replace(/- /g, "").split("\n").map(theme => theme.split(":")).map(([theme, task]) => <li><strong>{theme}</strong>: {task}</li>)}
            </ul>
        </>
    )
}