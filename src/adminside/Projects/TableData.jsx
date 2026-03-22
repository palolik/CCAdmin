import { PropTypes } from "prop-types";
import { useState, useEffect } from 'react';

const TableData = ({ data }) => {
    const { clientId, clientName, category,price, packagename , progress, time, action } = data;
    const [days, setDays] = useState(0);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
  
    const targetDate = new Date("April 15, 2024, 12:00 PM");
  
    const calculateTimeLeft = () => {
      const currentDate = new Date();
      const timeLeft = targetDate - currentDate;
  
      const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
  
      setDays(daysLeft);
      setHours(hoursLeft);
      setMinutes(minutesLeft);
      setSeconds(secondsLeft);
    };
  
    useEffect(() => {
      const intervalId = setInterval(calculateTimeLeft, 1000);
  
      return () => clearInterval(intervalId);
    }, []);
    return (
     
        <tr>
            <td colSpan={7}>
                <div className="flex flex-row items-center ">
                    <p className="w-[100px]">{clientId}</p>
                <p className="w-[200px]">{clientName}</p>
                <p className="w-[200px]">{category}</p>
                <p className="w-[200px]">{packagename}</p>
                <p className="w-[100px]">{price}</p>
                <div className="radial-progress text-sky-600 mr-10" style={{ "--value": progress }} role="progressbar">{progress}%</div>
                <p className="mr-20">   <div className="grid grid-flow-col gap-1 text-center auto-cols-max">
      <div className="flex flex-col p-2 bg-white rounded-sm bordered text-black ">
    <span className="countdown font-mono text-5xl bg-white text-black">
          <span style={{ '--value': days }}>{days}</span>
        </span>
        days
      </div>
      <div className="flex flex-col p-2 bg-white rounded-sm bordered text-black ">
    <span className="countdown font-mono text-5xl bg-white text-black">
          <span style={{ '--value': hours }}>{hours}</span>
        </span>
        hours
      </div>
      <div className="flex flex-col p-2 bg-white rounded-sm bordered text-black ">
    <span className="countdown font-mono text-5xl bg-white text-black">
          <span style={{ '--value': minutes }}>{minutes}</span>
        </span>
        min
      </div>
      <div className="flex flex-col p-2 bg-white rounded-sm bordered text-black ">
    <span className="countdown font-mono text-5xl bg-white text-black">
          <span style={{ '--value': seconds }}>{seconds}</span>
        </span>
        sec
      </div>
    </div></p>
                <div><button className='btn btn-sm'>chat</button><button className='btn btn-sm'>close Deal</button></div></div>
            </td>
        </tr>
    );
};

TableData.propTypes = {
    data: PropTypes.object,
}
export default TableData;