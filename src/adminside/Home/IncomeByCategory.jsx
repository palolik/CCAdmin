import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899"];

const IncomeByCategoryChart = ({
  data = [],
  title = "Income by Category",
  dataKey = "income",
}) => {
  const total = data.reduce((sum, item) => {
    return sum + Number(item[dataKey] || 0);
  }, 0);

  return (
    <div className="shadow-lg rounded-xl p-1 flex flex-col gap-3 bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>

        <span className="text-indigo-600 font-bold text-sm">
          ৳{total.toFixed(2)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="category"
            angle={-20}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 12 }}
          />

          <YAxis tickFormatter={(value) => `৳${value}`} />

          <Tooltip formatter={(value) => `৳${Number(value).toFixed(2)}`} />

          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeByCategoryChart;