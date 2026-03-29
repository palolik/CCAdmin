import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base_url } from "../../config/config.jsx";
import Card from "./Card.jsx";
import MiniCard from "./MiniCard.jsx";
import ChartCard from "./ChartCard.jsx";
import PackageStatusChart from "./PackageStatusChart.jsx";
import IncomeByCategoryChart from "./IncomeByCategory.jsx";
import IncomeByMonthChart from "./IncomeByMonth.jsx";
import PackageClicksChart from "./IncomeByClick.jsx";
import TasksByDepartmentChart from "./TasksChart.jsx";
import TaskStatusChart from "./TasksStatusChart.jsx";
import ClientsTable from "./ClientTable.jsx";
import EmployeesTable from "./EmployeeTable.jsx";


const Home = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${base_url}/admindashboard`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Loading dashboard...</div>;
  if (!stats) return <div className="p-10 text-center text-red-500">Failed to load dashboard data.</div>;

  const cartItems = [
    { id: 1, name: "Total Packages", number: stats.packages },
    { id: 2, name: "Total Tasks",     number: stats.tasks },
    { id: 3, name: "Total Employees", number: stats.employees },
    { id: 4, name: "Total Clients",   number: stats.clients },
    { id: 5, name: "Total Earning",   number: `$${stats.earning}` },
  ];

  const miniCardItems = [
    { id: 1, name: "Clients", number: stats.clients },
    { id: 2, name: "Tasks",   number: stats.tasks },
  ];

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  });

  return (
    <div className="w-full">
      <div className="hdr">Dashboard</div>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-10 px-6  lg:px-12">

        {/* Stat Cards */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6" {...fadeUp(0)}>
          {cartItems.map((cartItem) => (
            <motion.div key={cartItem.id} whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 200 }}>
              <Card cartItem={cartItem} />
            </motion.div>
          ))}
        </motion.div>

        {/* Package Charts */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-10" {...fadeUp(0.15)}>
          <PackageStatusChart   statusCounts={stats.statusCounts} />
          <IncomeByCategoryChart data={stats.incomeByCategory} />
          <IncomeByMonthChart    data={stats.incomeByMonth} />
          <PackageClicksChart    data={stats.packageClicks} />
        </motion.div>

        {/* Task Charts */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10" {...fadeUp(0.3)}>
            <ClientsTable   data={stats.topClients} />

          <TaskStatusChart        data={stats.taskStatusCounts} />
          <TasksByDepartmentChart data={stats.tasksByDepartment} />
        </motion.div>

      

           <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10" {...fadeUp(0.3)}>
              <EmployeesTable data={stats.employeeList} />

            <ChartCard />
          </motion.div>
      

      </div>
    </div>
  );
};

export default Home;