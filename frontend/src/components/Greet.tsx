import React, { useEffect, useState } from "react";
import OwlStandard from "../assets/clara-owl-standard.jpg";
import OwlOverjoyed from "../assets/clara-owl-overjoyed.jpg";
import OwlSleepy from "../assets/clara-owl-sleepy.jpg";

export const Greet: React.FC = () => {
    const imageOptions = [OwlStandard, OwlOverjoyed, OwlSleepy];
    const [randomNumber, setRandomNumber] = useState<number>(0);

    const generateRandomNumber = () => {
        const randomNumber = Math.floor(Math.random() * imageOptions.length);
        setRandomNumber(randomNumber);
    }

    useEffect(() => generateRandomNumber(), []);

    const randomImage = imageOptions[randomNumber];

    return (
        <>
        <div style={{display: "flex"}}>
        
        <img src={randomImage} className="profile-pic" />
        
        </div>
        </>
    )
}