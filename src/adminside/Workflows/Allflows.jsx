import React, { useEffect, useState } from "react";
import { base_url } from "../../config/config";
const API_BASE = `${base_url}`; 

async function api(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

const Allflows = () => {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFlows = async () => {
    try {
      const data = await api("/taskflows");
      setFlows(data);
    } catch (err) {
      console.error(err);
      alert("Unable to load flow templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  return (
       <div className="w-full">
            <div className="hdr">All Flows</div>

        {loading && <p>Loading...</p>}

        {!loading && flows.length === 0 && (
          <p className="text-gray-500">No flow templates found.</p>
        )}

        <div className="grid gap-4">
          {flows.map((flow) => (
            <div key={flow._id} className="p-4 border rounded bg-white shadow">
              <h2 className="text-xl font-semibold">{flow.title}</h2>
              <p className="text-sm text-gray-500">Package ID: {flow.packageId}</p>
              <div className="mt-2 text-sm">
                <strong>Total Tasks:</strong> {flow.flow?.length || 0}
              </div>

              {/* TASK LIST */}
              <div className="mt-3 bg-gray-50 p-3 rounded border space-y-3">
                {flow.flow?.length ? (
                  flow.flow.map((task, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded bg-white shadow-sm"
                    >
                     <p><strong> Task Order:</strong> {task.order}</p>

                      <p><strong>Task Name:</strong> {task.tname}</p>
                      <p><strong>Description:</strong> {task.tdesc}</p>
                      <p><strong>Department:</strong> {task.rdep}</p>
                      <p><strong>Sub-department:</strong> {task.rsubdep}</p>
                      <p><strong>Experts:</strong> {task.esprts}</p>
                      <p><strong>Time:</strong> {task.ttime} mins</p>
                      <p><strong>Cost:</strong> {task.tcc}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No tasks added.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    
  );
};

export default Allflows;
