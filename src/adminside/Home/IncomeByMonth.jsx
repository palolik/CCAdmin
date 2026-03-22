import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const IncomeByMonthChart = ({ data = [] }) => {
  const total = data.reduce((s, d) => s + d.income, 0);
  return (
    <div className="shadow-lg rounded-xl p-5 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Monthly Income</h2>
        <span className="text-indigo-600 font-bold text-sm">${total.toFixed(2)}</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={(v) => `$${v}`} />
          <Area type="monotone" dataKey="income" stroke="#6366f1" fill="url(#incomeGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export default IncomeByMonthChart;