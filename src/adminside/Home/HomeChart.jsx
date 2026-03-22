import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { base_url } from "../../config/config";

const HomeChart = ({ selectedMonth }) => {
  const [data, setData] = useState([]);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const year = new Date().getFullYear();
        const monthIndex = new Date(`${selectedMonth} 1, ${year}`).getMonth() + 1;
        const monthString = `${year}-${String(monthIndex).padStart(2, "0")}`;
        const res = await fetch(`${base_url}/vcount?month=${monthString}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setData(json.data);
          const total = json.data.reduce((sum, item) => sum + (item.views || 0), 0);
          setTotalViews(total);
        }
      } catch (err) {
        console.error("Error fetching visitor data:", err);
      }
    };
    fetchVisitors();
  }, [selectedMonth]);

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="text-lg font-semibold">{selectedMonth} View Summary</h2>
        <p className="text-gray-700 text-sm">
          Total Views:{" "}
          <span className="font-bold text-indigo-600">{totalViews}</span>
        </p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="views" fill="#8884d8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HomeChart;