import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar/Sidebar";

const Admin = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminData");
    const token = localStorage.getItem("adminToken");

    if (!storedAdmin || !token) {
      navigate("/admin/login");
      return;
    }

    try {
      const parsedAdmin = JSON.parse(storedAdmin);
      setAdminData(parsedAdmin);
    } catch (err) {
      console.error("Invalid admin data in localStorage:", err);
      localStorage.removeItem("adminData");
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  }, [navigate]);

  if (!adminData) return null;

  return (
    <div className="flex flex-row w-full min-h-screen bg-gray-50">
      <Sidebar />
      <Outlet />
    </div>
  );
};

export default Admin;
