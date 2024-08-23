import React, { useState, useEffect } from 'react';
import { formatDate } from '../helpers/date';

export const WakingLife = () => {
    return (
        <div>
            <h3>Waking Life</h3>
            <p>How have things been going lately during your waking hours?</p>

            <div style={{fontSize: "2rem"}}>
            <button style={{marginRight: ".5rem"}}>😭</button>
            <button style={{marginRight: ".5rem"}}>😑</button>
            <button style={{marginRight: ".5rem"}}>😁</button>
            </div>
        </div>
    )
};