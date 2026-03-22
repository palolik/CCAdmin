import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#8b5cf6","#14b8a6"];

const PackageClicksChart = ({ data = [] }) => {
  const shortened = data.map(d => ({
    ...d,
    shortName: d.name.length > 18 ? d.name.slice(0, 16) + "…" : d.name,
  }));
  return (
    <div className="shadow-lg rounded-xl p-5 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-700">Top Packages by Clicks</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={shortened} layout="vertical" margin={{ left: 10, right: 40 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="shortName" width={130} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="clicks" radius={[0, 6, 6, 0]}>
            <LabelList dataKey="clicks" position="right" style={{ fontSize: 12, fill: "#374151" }} />
            {shortened.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default PackageClicksChart;