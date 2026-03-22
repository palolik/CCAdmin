import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../../config/config";
const Adminlist = () => {
  const [roles, setRoles] = useState([]);
  const [roleForm, setRoleForm] = useState({
    rname: "",
    remail: "",
    rphone: "",
    pass: "",
    tabs: [],
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

const availableTabs = [
  "packages",
  "orders",
  "website",
  "businessplanner",
  "marketing",
  "accounts",
  "roles"
];

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${base_url}/roles`);
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "tabs") {
      const newTabs = [...roleForm.tabs];
      if (newTabs.includes(value)) {
        newTabs.splice(newTabs.indexOf(value), 1);
      } else {
        newTabs.push(value);
      }
      setRoleForm((prev) => ({ ...prev, tabs: newTabs }));
    } else {
      setRoleForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Add or update role
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleForm.rname || !roleForm.remail) return;

    const url = editId
      ? `${base_url}/roles/${editId}`
      : `${base_url}/roles`;
    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleForm),
      });
      const data = await res.json();

      if (data.success || data.insertedId) {
        Swal.fire(
          editId ? "Updated!" : "Added!",
          editId ? "Role updated successfully." : "Role added successfully.",
          "success"
        );
        setRoleForm({ rname: "", remail: "", rphone: "", pass: "", tabs: [] });
        setEditId(null);
        setShowForm(false);
        fetchRoles();
      } else {
        Swal.fire("Error!", "Something went wrong.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error!", "Something went wrong.", "error");
    }
  };

  // Delete role
  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${base_url}/roles/${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            Swal.fire("Deleted!", "Role deleted.", "success");
            setRoles(roles.filter((r) => r._id !== id));
          }
        } catch (error) {
          console.error("Error deleting role:", error);
        }
      }
    });
  };

  // Edit role
  const handleEdit = (role) => {
    setRoleForm({
      rname: role.rname,
      remail: role.remail,
      rphone: role.rphone,
      pass: role.pass,
      tabs: role.tabs,
    });
    setEditId(role._id);
    setShowForm(true);
  };

  return (
     <div className="w-full">
                    <div className='hdr'>Feedbacks</div>
    <div className="w-full px-6 py-6">
      <div className="flex justify-end items-center mb-6">
       
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          {editId ? "Edit Role" : "Add New Role"}
        </button>
      </div>

      {/* Floating Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg flex flex-col gap-4 relative"
          >
            <button
              type="button"
              className="absolute top-2 right-2 btn btn-sm btn-error"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setRoleForm({ rname: "", remail: "", rphone: "", pass: "", tabs: [] });
              }}
            >
              X
            </button>

            <h3 className="text-xl font-semibold mb-2">
              {editId ? "Edit Role" : "Add New Role"}
            </h3>

            <label className="flex flex-col gap-1">
              <span className="font-medium">Name</span>
              <input
                type="text"
                name="rname"
                value={roleForm.rname}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Enter name"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium">Email</span>
              <input
                type="email"
                name="remail"
                value={roleForm.remail}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Enter email"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium">Phone</span>
              <input
                type="text"
                name="rphone"
                value={roleForm.rphone}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Enter phone"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium">Password</span>
              <input
                type="text"
                name="pass"
                value={roleForm.pass}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Enter password"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium">Tab Access</span>
              <select
                name="tabs"
                multiple
                value={roleForm.tabs}
                onChange={handleInputChange}
                className="h-36 p-2 border rounded-md"
              >
                {availableTabs.map((tab) => (
                  <option key={tab} value={tab}>
                    {tab}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="btn btn-primary mt-2">
              {editId ? "Update Role" : "Add Role"}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-xl p-4">
        <table className="table-auto w-full">
          <thead className="bg-gray-100">
            <tr className="text-center font-semibold">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Phone</th>
              <th className="px-2 py-2">Pass</th>
              <th className="px-2 py-2">Tabs</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r._id} className="border-b hover:bg-gray-50 text-center">
                <td className="px-2 py-2">{r.rname}</td>
                <td className="px-2 py-2">{r.remail}</td>
                <td className="px-2 py-2">{r.rphone}</td>
                <td className="px-2 py-2">{r.pass}</td>
                <td className="px-2 py-2">{r.tabs.join(", ")}</td>
                <td className="px-2 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${
                      r.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-2 py-2 flex justify-center gap-2">
                  <button
                    className="btn btn-xs btn-warning"
                    onClick={() => handleEdit(r)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-xs btn-error"
                    onClick={() => handleDelete(r._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div></div>
  );
};

export default Adminlist;
