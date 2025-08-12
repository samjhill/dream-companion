import React from 'react';

export const WakingLife: React.FC = () => {
    return (
        <div>
            <h3>Waking Life</h3>
            <p>How have things been going lately during your waking hours?</p>

            <div style={{ fontSize: "2rem" }}>
                <button style={{ marginRight: ".5rem" }}>😭</button>
                <button style={{ marginRight: ".5rem" }}>😑</button>
                <button style={{ marginRight: ".5rem" }}>😁</button>
            </div>
        </div>
    );
};
