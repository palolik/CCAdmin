import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";

const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#8b5cf6","#14b8a6"];

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
          <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: "#374151" }} />
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default TasksByDepartmentChart;