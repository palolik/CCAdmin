import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";

const Service = () => {
  const [service, setService] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`${base_url}/service`)
      .then((res) => res.json())
      .then((data) => setService(data))
      .catch((error) => console.error("Error fetching services:", error));
  }, []);

  const handleDelete = (_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${base_url}/delservice/${_id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "The service has been deleted.", "success");
              setService((prev) => prev.filter((s) => s._id !== _id));
            }
          })
          .catch((error) => console.error("Error deleting service:", error));
      }
    });
  };

  const handleAddPost = async (event) => {
    event.preventDefault();
    const form = event.target;
    const postData = {
      serviceTitle: form.serviceTitle.value.trim(),
      serviceDescription: form.serviceDescription.value.trim(),
      serviceBgImage: form.serviceBgImage.value.trim(),
    };
    try {
      const response = await fetch(`${base_url}/addservice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      const data = await response.json();
      if (data.insertedId) {
        Swal.fire("New Service Added!", "Successfully added.", "success");
        form.reset();
        setShowForm(false);
        setService([...service, { ...postData, _id: data.insertedId }]);
      } else {
        Swal.fire("Error!", "Failed to add service.", "error");
      }
    } catch (error) {
      console.error("Error adding service:", error);
      Swal.fire("Error!", "Unexpected error occurred.", "error");
    }
  };

  return (
    <div className="w-full">
      <div className="hdr">Services</div>

      <div className="flex justify-end items-center mb-4 px-2">
        <button onClick={() => setShowForm(true)} className="smbut">
          + Add New Service
        </button>
      </div>

      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr className="text-center font-semibold">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {service.map((s) => (
              <tr key={s._id} className="text-center border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.serviceTitle}</td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-600">{s.serviceDescription}</td>
                <td className="px-4 py-3">
                  <img src={s.serviceBgImage} className="w-20 h-20 object-cover rounded mx-auto" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button className="btn btn-xs bg-blue-300 text-black" disabled>Update</button>
                    <button onClick={() => handleDelete(s._id)} className="btn btn-xs btn-error">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {service.length === 0 && (
              <tr><td colSpan="4" className="text-center py-8 text-gray-400">No services found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards (< md) ── */}
      <div className="md:hidden flex flex-col gap-3 px-2">
        {service.length > 0 ? service.map((s) => (
          <div key={s._id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex gap-3 p-3">
            {/* Image */}
            <img
              src={s.serviceBgImage}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
            {/* Info */}
            <div className="flex flex-col justify-between flex-1 min-w-0">
              <div>
                <p className="font-semibold text-gray-800 text-sm leading-tight">{s.serviceTitle}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.serviceDescription}</p>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-xs bg-blue-300 text-black flex-1" disabled>Update</button>
                <button onClick={() => handleDelete(s._id)} className="btn btn-xs btn-error flex-1">Delete</button>
              </div>
            </div>
          </div>
        )) : (
          <p className="text-center py-10 text-gray-400 text-sm">No services found.</p>
        )}
      </div>

      {/* ── Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
            >✕</button>
            <h3 className="text-xl font-semibold mb-4 text-center">Add New Service</h3>
            <form onSubmit={handleAddPost} className="flex flex-col gap-3">
              <input
                name="serviceTitle"
                type="text"
                placeholder="Service Title"
                className="input input-bordered w-full"
                required
              />
              <input
                name="serviceDescription"
                type="text"
                placeholder="Service Description"
                className="input input-bordered w-full"
                required
              />
              <input
                name="serviceBgImage"
                type="text"
                placeholder="Background Image URL"
                className="input input-bordered w-full"
                required
              />
              <button type="submit" className="btn btn-primary w-full mt-3">
                Add Service
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Service;