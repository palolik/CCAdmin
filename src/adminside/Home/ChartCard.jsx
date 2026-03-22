import { useState } from "react";
import HomeChart from "./HomeChart";

const ChartCard = () => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);

  return (
    <div className="flex flex-col gap-5 p-5 shadow-lg rounded-xl w-full">
      <div className="flex flex-row gap-3 justify-center items-center">
        <label htmlFor="months">Month</label>
        <select
          id="months"
          name="months"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border-4 border-blue-800 rounded-lg"
        >
          {months.map((month, index) => (
            <option key={index} value={month}>{month}</option>
          ))}
        </select>
      </div>
      <HomeChart selectedMonth={selectedMonth} />
    </div>
  );
};

export default ChartCard;