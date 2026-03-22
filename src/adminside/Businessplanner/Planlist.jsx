import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";

const Planlist = () => {
  const [planners, setPlanners] = useState([]);
  const navigate = useNavigate();

  const getPlanners = async () => {
    try {
      const res = await fetch(`${base_url}/getque`);
      const data = await res.json();
      setPlanners(data);
    } catch (err) {
      console.error("Error fetching planners:", err);
    }
  };

  // Handle delete
  const deletePlanner = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This planner will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${base_url}/planner/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.deletedCount > 0) {
        Swal.fire("Deleted!", "Planner has been removed.", "success");
        getPlanners(); // refresh list
      }
    } catch (err) {
      Swal.fire("Error!", "Unable to delete planner.", "error");
    }
  };

  useEffect(() => {
    getPlanners();
  }, []);

  return (
     <div className="w-full">
            <div className="hdr">All Forms</div>
      <div className="overflow-x-auto shadow border rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Title</th>
              <th className="p-3 border">Total Questions</th>
              <th className="p-3 border">Created</th>
              <th className="p-3 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {planners.length > 0 ? (
              planners.map((p) => (
                <tr key={p._id} className="text-center">
                  <td className="p-3 border">{p.title}</td>
                  <td className="p-3 border">{p.questions.length}</td>
                  <td className="p-3 border">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 border space-x-3">
                    <button
                      onClick={() => navigate(`/admin/editplanner/${p._id}`)}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => navigate(`/admin/planform/${p._id}`)}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                     form
                    </button>
                    <button
                      onClick={() => deletePlanner(p._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-5 text-center text-gray-500">
                  No planners found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Planlist;
