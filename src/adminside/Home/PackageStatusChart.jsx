import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const STATUS_COLORS = {
  pending: "#f59e0b",
  started: "#3b82f6",
  completed: "#10b981",
};

const PackageStatusChart = ({ statusCounts = {} }) => {
  const data = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <div className="shadow-lg rounded-xl p-5 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-700">Package Status</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={4}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={STATUS_COLORS[entry.status] || "#6366f1"} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PackageStatusChart;