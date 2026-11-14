import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
import ImageInput from "../common/ImageInput";
import { AD_SLOTS, slotFor, sizeText } from "./adSlots";
import { ShimmerTable } from "../../userside/utils/Shimmer.jsx";
const Advertise = () => {
  const [ima, setIma] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formLocation, setFormLocation] = useState("");
  const formSlot = slotFor(formLocation);

  // Load advertisements
  useEffect(() => {
    fetch(`${base_url}/advertise`)
      .then((res) => res.json())
      .then((data) => setIma(data))
      .catch((error) => console.error("Error fetching advertisements:", error))
      .finally(() => setLoading(false));
  }, []);

  // Delete handler
  const handleDelete = (_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,

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
        setFormLocation("");
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
                <th>Size</th>
                <th>Redirect Link</th>
                 <th>Start Date</th>

                <th>Till Date</th>
                <th>Clicks</th>
                <th>Status</th>

                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <ShimmerTable rows={5} cols={9} asRows />}
              {!loading && ima.map((ad) => (
                <tr key={ad._id} className="text-center border-b">
                  <td className="flex justify-center">
                    <img
                      src={ad.imglink}
                      alt="Advert"
                      className="h-12 max-w-[140px] object-contain rounded border bg-gray-50"
                    />
                  </td>
                  <td>
                    {slotFor(ad.location)?.label || ad.location}
                    {ad.placeholder && (
                      <span className="ml-1 px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 text-[10px] align-middle">
                        Placeholder
                      </span>
                    )}
                  </td>
                  <td className="text-sm text-gray-600 whitespace-nowrap">
                    {sizeText(slotFor(ad.location))}
                  </td>
                  <td className="truncate max-w-xs text-blue-600 underline">
                    <a href={ad.rdlink} target="_blank" rel="noopener noreferrer">
                      {ad.rdlink}
                    </a>
                  </td>
                  <td>{ad.startdate}</td>

                  <td>{ad.tilldate}</td>
                     <td>{ad.clicks}</td>
                  <td className="py-2 px-3">
              <select
                value={ad.status || "pending"}
                onChange={(e) =>
                  handleStatusChange(ad._id, e.target.value)
                }
                className={`border rounded px-2 py-1 text-sm cursor-pointer ${
                  ad.status === "active"
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
              {!loading && ima.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-gray-500">
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
                <ImageInput
                  name="imglink"
                  placeholder="Image URL or upload"
                  required
                />
                <select
                  name="location"
                  className="select select-bordered w-full"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                >
                  <option value="" disabled>
                    Select ad location
                  </option>
                  {AD_SLOTS.map((slot) => (
                    <option key={slot.key} value={slot.key}>
                      {slot.label} — {sizeText(slot)}
                    </option>
                  ))}
                </select>
                {formSlot && (
                  <div className="rounded-lg bg-gray-50 border px-3 py-2 text-sm">
                    <p>
                      <span className="font-medium">Image size:</span> {sizeText(formSlot)}{" "}
                      <span className="text-gray-500">
                        (ratio {formSlot.width}:{formSlot.height}, upload at 2× for sharp screens)
                      </span>
                    </p>
                    <p className="text-gray-500">{formSlot.where}</p>
                  </div>
                )}
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
                <p className="text-xs text-gray-500">
                  New ads start as Pending. Set status to Active to show them on the site between the start and till dates.
                </p>
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
