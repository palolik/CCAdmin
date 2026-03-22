import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899"];

const IncomeByCategoryChart = ({ data = [] }) => (
  <div className="shadow-lg rounded-xl p-5 flex flex-col gap-3">
    <h2 className="text-lg font-semibold text-gray-700">Income by Category</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(v) => `$${v}`} />
        <Bar dataKey="income" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);
export default IncomeByCategoryChart;