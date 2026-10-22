import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base_url } from "../../config/config.jsx";

import Card from "./Card.jsx";
import ChartCard from "./ChartCard.jsx";
import PackageStatusChart from "./PackageStatusChart.jsx";
import IncomeByCategoryChart from "./IncomeByCategory.jsx";
import IncomeByMonthChart from "./IncomeByMonth.jsx";
import PackageClicksChart from "./IncomeByClick.jsx";
import TasksByDepartmentChart from "./TasksChart.jsx";
import TaskStatusChart from "./TasksStatusChart.jsx";
import ClientsTable from "./ClientTable.jsx";
import EmployeesTable from "./EmployeeTable.jsx";
import { Shimmer, ShimmerStats } from "../../userside/utils/Shimmer.jsx";

const Home = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${base_url}/admindashboard`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Dashboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="hdr">Dashboard</div>

        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-10 px-6 lg:px-12">
          <ShimmerStats
            count={10}
            cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">
            {[0, 1, 2, 3].map((i) => (
              <Shimmer key={i} className="h-[370px] w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
            {[0, 1, 2].map((i) => (
              <Shimmer key={i} className="h-[370px] w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
            {[0, 1, 2].map((i) => (
              <Shimmer key={i} className="h-[370px] w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-10 text-center text-red-500">
        Failed to load dashboard data.
      </div>
    );
  }

  const formatMoney = (value) => {
    return `৳ ${Number(value || 0).toLocaleString()}`;
  };

  const cardItems = [
    {
      id: 1,
      name: "Total Packages",
      number: stats.packages || 0,
    },
    {
      id: 2,
      name: "Total Tasks",
      number: stats.tasks || 0,
    },
    {
      id: 3,
      name: "Total Employees",
      number: stats.employees || 0,
    },
    {
      id: 4,
      name: "Total Clients",
      number: stats.clients || 0,
    },
    {
      id: 5,
      name: "Total Earning",
      number: formatMoney(stats.earning),
    },
    {
      id: 6,
      name: "Sold Earning",
      number: formatMoney(stats.soldEarning),
    },
    {
      id: 7,
      name: "Manual Income",
      number: formatMoney(stats.manualEarning),
    },
    {
      id: 8,
      name: "Total Expense",
      number: formatMoney(stats.expense),
    },
    {
      id: 9,
      name: "Net Profit",
      number: formatMoney(stats.netProfit),
    },
    {
      id: 10,
      name: "Expense Entries",
      number: stats.expenseCount || 0,
    },
  ];

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  });

  return (
    <div className="w-full">
      <div className="hdr">Dashboard</div>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-10 px-6 lg:px-12">
        {/* Stat Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
          {...fadeUp(0)}
        >
          {cardItems.map((cardItem) => (
            <motion.div
              key={cardItem.id}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Card cartItem={cardItem} />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Charts */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-10"
          {...fadeUp(0.15)}
        >
          <PackageStatusChart statusCounts={stats.statusCounts || {}} />

<IncomeByCategoryChart
  title="Expense by Category"
  data={stats.expenseByCategory || []}
  dataKey="expense"
/>   
          <IncomeByMonthChart
            title="Monthly Income"
            data={stats.incomeByMonth || []}
            dataKey="income"
          />

          <PackageClicksChart data={stats.packageClicks || []} />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10"
          {...fadeUp(0.25)}
        >
          <IncomeByMonthChart
            title="Monthly Expense"
            data={stats.expenseByMonth || []}
            dataKey="expense"
          />

          <IncomeByMonthChart
            title="Monthly Profit"
            data={stats.profitByMonth || []}
            dataKey="profit"
          />

<IncomeByCategoryChart
  title="Income by Category"
  data={stats.incomeByCategory || []}
  dataKey="income"
/>

     </motion.div>

        {/* Task / Client Charts */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10"
          {...fadeUp(0.3)}
        >
          <ClientsTable data={stats.topClients || []} />

          <TaskStatusChart data={stats.taskStatusCounts || []} />

          <TasksByDepartmentChart data={stats.tasksByDepartment || []} />
        </motion.div>

        {/* Employee Table + Extra Chart */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10"
          {...fadeUp(0.4)}
        >
          <EmployeesTable data={stats.employeeList || []} />

          <ChartCard />
        </motion.div>
      </div>
    </div>
  );
};

export default Home;