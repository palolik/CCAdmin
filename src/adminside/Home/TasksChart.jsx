import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";

const COLORS = ["#1d4ed8", "#60a5fa", "#334155", "#94a3b8", "#1e3a8a", "#93c5fd", "#64748b", "#cbd5e1"];

const TasksByDepartmentChart = ({ data = [] }) => (
  <div className="shadow-lg rounded-xl p-5 flex flex-col gap-3">
    <h2 className="text-lg font-semibold text-gray-700">Tasks by Department</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 40 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="department"
          width={140}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: "#334155" }} />
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default TasksByDepartmentChart;