import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";

const AdminPortfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = () => {
    fetch(`${base_url}/getportfolio`)
      .then((res) => res.json())
      .then((data) => setPortfolios(data))
      .catch((error) => console.error("Error fetching portfolios:", error));
  };

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
        fetch(`${base_url}/portfolio/${_id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              Swal.fire("Deleted!", "Portfolio deleted successfully.", "success");
              setPortfolios((prev) => prev.filter((p) => p._id !== _id));
            }
          })
          .catch((error) => console.error("Error deleting portfolio:", error));
      }
    });
  };
const handleStatusChange = (_id, currentStatus) => {
  Swal.fire({
    title: "Change Portfolio Status",
    html: `
      <select id="status-select" class="swal2-input" style="width: 80%;">
        <option value="hidden" ${currentStatus === "hidden" ? "selected" : ""}>Hidden</option>
        <option value="visible" ${currentStatus === "visible" ? "selected" : ""}>Visible</option>
        <option value="archived" ${currentStatus === "archived" ? "selected" : ""}>Archived</option>
      </select>
      <textarea id="status-note" class="swal2-textarea" placeholder="Add a note (optional)" style="width: 80%;"></textarea>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Update Status",
    preConfirm: () => {
      const status = document.getElementById("status-select").value;
      const note = document.getElementById("status-note").value;
      return { status, note };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const { status, note } = result.value;
      
      fetch(`${base_url}/portfolio/${_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status, 
          note  
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            let message = "Portfolio status updated successfully!";
            if (note && note.trim()) {
              message += `\n\nNote: ${note}`;
            }
            Swal.fire("Updated!", message, "success");
            
            // Update local state with note
            setPortfolios((prev) =>
              prev.map((p) => (p._id === _id ? { ...p, status, statusNote: note } : p))
            );
          }
        })
        .catch((error) => {
          console.error("Error updating status:", error);
          Swal.fire("Error", "Failed to update status", "error");
        });
    }
  });
};
  const handleAddPortfolio = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    fetch(`${base_url}/portfolio`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          Swal.fire("Success!", "Portfolio added successfully.", "success");
          setShowForm(false);
          fetchPortfolios();
          e.target.reset();
        }
      })
      .catch((error) => console.error("Error adding portfolio:", error));
  };

  const getStatusBadge = (status) => {
    const badges = {
      hidden: "bg-yellow-200 text-yellow-800",
      visible: "bg-green-200 text-green-800",
      archived: "bg-gray-200 text-gray-800",
    };
    return badges[status] || "bg-gray-200 text-gray-800";
  };

  const filteredPortfolios = filterType === "all" 
    ? portfolios 
    : portfolios.filter((p) => p.portfolioType === filterType);

  const portfolioTypes = [...new Set(portfolios.map((p) => p.portfolioType))];

  return (
    <div className="w-full">
      <div className="hdr">Portfolio Management</div>
      <div className="relative px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          {/* Filter Dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select select-bordered"
          >
            <option value="all">All Types</option>
            {portfolioTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button onClick={() => setShowForm(true)} className="smbut">
            + Add New Portfolio
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-auto w-full border">
            <thead className="bg-gray-100">
              <tr className="text-center font-semibold">
                <th>Image</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Short Details</th>
                <th>Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPortfolios.map((portfolio) => (
                <tr key={portfolio._id} className="text-center border-b">
                  <td className="px-2 py-2">
                    <img
                      src={portfolio.image}
                      alt={portfolio.title}
                      className="w-16 h-16 object-cover rounded mx-auto"
                    />
                  </td>
                  <td className="px-2 py-2 font-medium">{portfolio.title}</td>
                  <td className="px-2 py-2">
                    <span className="badge badge-info">{portfolio.portfolioType}</span>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(portfolio.status)}`}>
                      {portfolio.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 max-w-xs truncate">
                    {portfolio.shortDetails}
                  </td>
                  <td className="px-2 py-2">
                    {portfolio.link ? (
                      <a
                        href={portfolio.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleStatusChange(portfolio._id, portfolio.status)}
                        className="btn btn-xs bg-purple-300 text-black"
                      >
                        Status
                      </button>
                      <Link
                        to={`/update-portfolio/${portfolio._id}`}
                        className="btn btn-xs bg-blue-300 text-black"
                      >
                        Update
                      </Link>
                      <button
                        onClick={() => handleDelete(portfolio._id)}
                        className="btn btn-xs btn-error"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== FLOATING FORM MODAL ===== */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
              >
                ✕
              </button>
              <h3 className="text-xl font-semibold mb-4 text-center">
                Add New Portfolio
              </h3>
              <form onSubmit={handleAddPortfolio} className="flex flex-col gap-3">
                <input
                  name="title"
                  type="text"
                  placeholder="Portfolio Title"
                  className="input input-bordered w-full"
                  required
                />
                <input
                  name="portfolioType"
                  type="text"
                  placeholder="Portfolio Type (e.g., web-development)"
                  className="input input-bordered w-full"
                  required
                />
                <textarea
                  name="shortDetails"
                  placeholder="Short Details"
                  className="textarea textarea-bordered w-full"
                  rows="3"
                  required
                />
                <input
                  name="link"
                  type="url"
                  placeholder="Project Link (optional)"
                  className="input input-bordered w-full"
                />
                <input
                  name="metaData"
                  type="text"
                  placeholder="Meta Data (optional)"
                  className="input input-bordered w-full"
                />
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Portfolio Image</span>
                  </label>
                  <input
                    name="image"
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered w-full"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-3">
                  Add Portfolio
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortfolio;