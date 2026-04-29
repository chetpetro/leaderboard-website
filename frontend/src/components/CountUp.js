import React, { useEffect, useRef } from 'react';
import '../styles/components/CountUp.css';

const CountUp = ({ to, speed = 0.05, acceleration = 1.02, className = "" }) => {
    const countRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!to || isNaN(to) || !countRef.current) return;

        const target = Number(to);
        let currentValue = 0;
        // The 'velocity' starts at baseSpeed and grows every frame
        let velocity = speed;

        const step = () => {
            if (!countRef.current) return;
            // 1. Add randomness to the increment (0.8x to 1.2x multiplier)
            const randomness = 0.8 + Math.random() * 0.4;

            // 2. Increase the value based on current velocity
            currentValue += velocity * randomness;

            // 3. Accelerate the velocity for the next frame
            velocity *= acceleration;

            if (currentValue >= target) {
                countRef.current.style.setProperty('--value', Math.floor(target));
                cancelAnimationFrame(rafRef.current);
            } else {
                countRef.current.style.setProperty('--value', Math.floor(currentValue));
                rafRef.current = window.requestAnimationFrame(step);
            }
        };

        rafRef.current = window.requestAnimationFrame(step);

        return () => cancelAnimationFrame(rafRef.current);
    }, [to, speed, acceleration]);

    return (
        <span ref={countRef} className={`animate-count-up ${className}`} />
    );
};

export default CountUp;