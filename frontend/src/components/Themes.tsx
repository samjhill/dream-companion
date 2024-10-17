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

    return (
        <>
            <h2>Themes</h2>
            <ul>
                {themes.split("\n").map(theme => (<li>{theme}</li>))}
            </ul>
        </>
    )
}