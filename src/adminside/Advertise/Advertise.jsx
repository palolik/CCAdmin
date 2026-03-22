import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
const Advertise = () => {
  const [ima, setIma] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Load advertisements
  useEffect(() => {
    fetch(`${base_url}/advertise`)
      .then((res) => res.json())
      .then((data) => setIma(data))
      .catch((error) => console.error("Error fetching advertisements:", error));
  }, []);

  // Delete handler
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
        fetch(`${base_url}/deladvertise/${_id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "Advertisement has been deleted.", "success");
              setIma((prev) => prev.filter((item) => item._id !== _id));
            }
          })
          .catch((error) => console.error("Error deleting advertisement:", error));
      }
    });
  };

  const handleAddPost = async (event) => {
    event.preventDefault();
    const form = event.target;
    const postData = {
      imglink: form.imglink.value.trim(),
      location: form.location.value.trim(),
      rdlink: form.rdlink.value.trim(),
      tilldate: form.tilldate.value.trim(),
      startdate: form.startdate.value.trim(),
      status: "pending",
      clicks: 0,
      createdAt: new Date(),
    };

    try {
      const response = await fetch(`${base_url}/addadvertise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (data.insertedId) {
        Swal.fire("Success!", "Advertisement added successfully.", "success");
        form.reset();
        setShowForm(false);
        setIma([...ima, { ...postData, _id: data.insertedId }]);
      } else {
        Swal.fire("Error!", "Failed to add advertisement.", "error");
      }
    } catch (error) {
      console.error("Error adding advertisement:", error);
      Swal.fire("Error!", "Unexpected error occurred.", "error");
    }
  };
const handleStatusChange = (adId, newStatus) => {
  fetch(`${base_url}/adstatus/${adId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.modifiedCount > 0 || data.acknowledged) {
        Swal.fire({
          icon: "success",
          title: "Status Updated!",
          text: `Status changed to ${newStatus}`,
          timer: 1200,
          showConfirmButton: false,
        });

        setIma((prev) =>
          prev.map((ad) =>
            ad._id === adId ? { ...ad, status: newStatus } : ad
          )
        );
      } else {
        Swal.fire({
          icon: "info",
          title: "No Changes",
          text: "Status was already set to this value.",
        });
      }
    })
    .catch((error) => {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: "Could not update status.",
      });
    });
};

  return (
    <div className="w-full">
      <div className="hdr">Advertisement</div>

      <div className="relative px-6 py-4">
        <div className="flex justify-end items-center mb-4">
          <button onClick={() => setShowForm(true)} className="smbut">
            + Add New Advertisement
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-auto w-full border">
            <thead className="bg-gray-100">
              <tr className="text-center font-semibold">
                <th>Image</th>
                <th>Location</th>
                <th>Redirect Link</th>
                 <th>Start Date</th>

                <th>Till Date</th>
                <th>Clicks</th>
                <th>Status</th>

                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ima.map((ad) => (
                <tr key={ad._id} className="text-center border-b">
                  <td className="flex justify-center">
                    <img
                      src={ad.imglink}
                      alt="Advert"
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  </td>
                  <td>{ad.location}</td>
                  <td className="truncate max-w-xs text-blue-600 underline">
                    <a href={ad.rdlink} target="_blank" rel="noopener noreferrer">
                      {ad.rdlink}
                    </a>
                  </td>
                  <td>{ad.startdate}</td>

                  <td>{ad.tilldate}</td>
                     <td>{ad.clicks}</td>
                  <td>{ad.status}</td>   <td className="py-2 px-3">
              <select
                value={ad.status || "pending"}
                onChange={(e) =>
                  handleStatusChange(ad._id, e.target.value)
                }
                className={`border rounded px-2 py-1 text-sm cursor-pointer ${
                  ad.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : ad.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >   <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
              </select>
            </td>
                  <td className="flex justify-center gap-2">
                    <button
                      onClick={() => handleDelete(ad._id)}
                      className="btn btn-xs btn-error"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {ima.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No advertisements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
              >
                ✕
              </button>
              <h3 className="text-xl font-semibold mb-4 text-center">
                Add Advertisement
              </h3>
              <form onSubmit={handleAddPost} className="flex flex-col gap-3">
                <input
                  name="imglink"
                  type="text"
                  placeholder="Image URL"
                  className="input input-bordered w-full"
                  required
                />
           <select
    name="location"
    className="select select-bordered w-full"
    required
    defaultValue=""
  >
    <option value="" disabled>
      Select Ad Location
    </option>
    <option value="Header">Header</option>
    <option value="hls">home leftSidebar</option>
        <option value="hrs">home right Sidebar</option>

    <option value="Footer">Footer</option>
    <option value="Homepage Banner">Homepage Banner</option>
    <option value="Popup">Popup</option>
  </select>
                <input
                  name="rdlink"
                  type="text"
                  placeholder="Redirect Link"
                  className="input input-bordered w-full"
                  required
                />
                <input
                  name="startdate"
                  type="date"
                  className="input input-bordered w-full"
                  required
                />
                  <input
                  name="tilldate"
                  type="date"
                  className="input input-bordered w-full"
                  required
                />
                <button type="submit" className="btn btn-primary w-full mt-3">
                  Add Advertisement
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Advertise;
