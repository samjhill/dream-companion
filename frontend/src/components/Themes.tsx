import { fetchAuthSession } from "aws-amplify/auth";
import React, { useEffect, useState } from "react";
import { getUserPhoneNumber } from "../helpers/user";

export const Themes: React.FC = () => {
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
    }, []);

    if (!themes) {
        return null;
    }
    
    return (
        <>
            <h2>Themes</h2>
            <p>Now that I've gotten to know you better, here are the patterns I'm seeing in your dreams, as well as some concrete tasks you can do to work on them in your waking life.</p>
            <ul>
                {themes.replace(/- /g, "").split("\n").map(theme => theme.split(":")).map(([theme, task]) => <li><strong>{theme}</strong>: {task}</li>)}
            </ul>
        </>
    )
}