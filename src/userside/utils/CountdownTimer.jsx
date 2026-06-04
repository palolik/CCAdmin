/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });
    const [isTimeUp, setIsTimeUp] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date(targetDate);
            const difference = target - now;

            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            return { days, hours, minutes, seconds };
        };

        const countdownInterval = setInterval(() => {
            const timeLeft = calculateTimeLeft();
            setTimeLeft(timeLeft);

            if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
                clearInterval(countdownInterval); 
                setIsTimeUp(true);// Stop the interval once the countdown reaches zero
            }
        }, 1000);

        return () => clearInterval(countdownInterval); // Cleanup the interval on component unmount
    }, [targetDate]);
    // useEffect(() => {
    //     if (isTimeUp) {
    //         window.alert("Time is up, you were late to submit your work.");
    //     }
    // }, [isTimeUp]);
    return (
        <div>
            <div className='flex flex-row '>
                <div className="flex flex-row ">
                    <div className="flex flex-col p-2 bg-white rounded-sm bordered text-black">
                        <span className="countdown font-mono text-xs bg-white text-black">
                            <span style={{ "--value": timeLeft.days }}></span>
                        </span>
                        d
                    </div>
                    <div className="flex flex-col p-2 bg-white rounded-sm bordered text-black">
                        <span className="countdown font-mono text-xs bg-white text-black">
                            <span style={{ "--value": timeLeft.hours }}></span>
                        </span>
                        h
                    </div>
                    <div className="flex flex-col p-2 bg-white rounded-sm bordered text-black">
                        <span className="countdown font-mono text-xs bg-white text-black">
                            <span style={{ "--value": timeLeft.minutes }}></span>
                        </span>
                        m
                    </div>
                    <div className="flex flex-col p-2 bg-white rounded-sm bordered text-black">
                        <span className="countdown font-mono text-xs bg-white text-black">
                            <span style={{ "--value": timeLeft.seconds }}></span>
                        </span>
                        s
                    </div>
                </div>
            </div>
          
        </div>
    );
};

export default CountdownTimer;
