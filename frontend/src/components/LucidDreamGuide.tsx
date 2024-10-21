import { useEffect, useState } from "react";
import { generateRandomNumber } from "../helpers/numbers";

const sleepTips = [
    "Stick to a consistent sleep schedule, even on weekends.",
    "Create a relaxing bedtime routine to signal your body it's time to wind down.",
    "Limit exposure to screens (phones, computers, TV) at least 30 minutes before bed.",
    "Keep your bedroom cool, dark, and quiet to optimize sleep conditions.",
    "Invest in a comfortable mattress and pillows for proper support.",
    "Avoid large meals and heavy snacks close to bedtime.",
    "Limit caffeine intake, especially in the afternoon and evening.",
    "Avoid alcohol before bed, as it can disrupt sleep later in the night.",
    "Stay physically active during the day, but avoid vigorous exercise close to bedtime.",
    "Try relaxing exercises like yoga or stretching before bed to calm your body.",
    "Use white noise machines or earplugs if noise is a problem in your sleep environment.",
    "Reserve your bed for sleep and intimacy only to condition your mind.",
    "Limit naps during the day to 20-30 minutes, and avoid napping late in the afternoon.",
    "Consider blackout curtains or a sleep mask if light is a problem in your room.",
    "If you can't fall asleep within 20 minutes, get out of bed and do something relaxing.",
    "Try reading a book or listening to calming music before bed.",
    "Use aromatherapy with calming scents like lavender or chamomile.",
    "Practice mindfulness or meditation to reduce stress and anxiety before bed.",
    "Establish a regular sleep-wake cycle, even on days off.",
    "Take a warm bath or shower to help relax your muscles before bed.",
    "Avoid looking at the clock if you wake up during the night, as it can increase stress.",
    "Limit your fluid intake before bed to prevent frequent bathroom trips at night.",
    "Keep a sleep journal to track your sleep habits and identify potential issues.",
    "Try deep breathing exercises to calm your mind before sleeping.",
    "Make sure your feet are warm—wear socks if needed to improve circulation.",
    "Avoid discussing or thinking about stressful topics right before bed.",
    "Try progressive muscle relaxation to ease tension in your body.",
    "Keep electronic devices out of the bedroom to minimize distractions.",
    "Drink herbal teas like chamomile or valerian root before bed to promote relaxation.",
    "Expose yourself to natural sunlight during the day to regulate your circadian rhythm.",
    "Limit your bed use to sleep—avoid working or watching TV in bed.",
    "If you can, gradually wake up earlier to get more morning light and better sleep at night.",
    "Avoid vigorous mental activities close to bedtime.",
    "Set your bedroom temperature between 60-67°F for optimal sleep.",
    "Stay hydrated during the day, but avoid drinking too much water right before bed.",
    "Try a weighted blanket to help reduce anxiety and improve sleep quality.",
    "Consider using a sleep tracker to monitor patterns and adjust habits.",
    "Use relaxing apps or guided meditation to prepare your mind for sleep.",
    "Limit sugary snacks and refined carbohydrates close to bedtime.",
    "Make sure your bedroom has proper ventilation for fresh air throughout the night.",
    "If you wake up in the middle of the night, avoid using your phone to check the time or notifications.",
    "Incorporate calming rituals, like journaling or reflecting on positive moments from your day.",
    "Try melatonin supplements if you struggle with falling asleep (consult a doctor first).",
    "Maintain a balanced diet with plenty of fruits and vegetables to support overall health and sleep.",
    "Try to go to bed earlier when you're feeling tired rather than pushing through with more activities.",
    "Manage your stress levels during the day with techniques like journaling or talking to a friend.",
    "Consider using essential oil diffusers to create a calming atmosphere before bedtime.",
    "Create a wind-down playlist with soft, relaxing music to set the mood for sleep.",
    "Experiment with sleep positions to find the most comfortable one for your body."
]

export const LucidDreamGuide: React.FC = () => {
    const [randomSleepTip, setRandomSleepTip] = useState<string>("");

    useEffect(() => {
        setRandomSleepTip(sleepTips[generateRandomNumber(sleepTips.length)]);
    }, []);


    return (
        <div className="lucid-dream-section">
        <div style={{display: "flex"}}>
        
        
        </div>
        <h2>Today's key to dreamland</h2>
        <p>{randomSleepTip}</p>
        </div>
    )
}