import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
const AllHClient = () => {
  const [clients, setClients] = useState([]);

  // Fetch All Clients
  useEffect(() => {
    fetch(`${base_url}/hclient`)
      .then((res) => res.json())
      .then((data) => {
        setClients(data);
      })
      .catch((err) => console.error("Error fetching clients:", err));
  }, []);

  // Delete Client
  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${base_url}/delhclient/${id}`, {
          method: "DELETE",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "Client removed successfully.", "success");
              setClients(clients.filter((item) => item._id !== id));
            }
          })
          .catch((err) => console.error("Delete error:", err));
      }
    });
  };

  // Add New Client
  const handleAddPost = async (e) => {
    e.preventDefault();
    const form = e.target;

    const newClient = {
      name: form.name.value.trim(),
      logo: form.logo.value.trim(),
      link: form.link.value.trim(),
    };

    try {
      const res = await fetch(`${base_url}/addhclient`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClient),
      });
      const data = await res.json();

      if (data.insertedId) {
        Swal.fire("Added!", "New client added successfully!", "success");
        setClients([...clients, { _id: data.insertedId, ...newClient }]);
        form.reset();
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  return (
    <div className="w-full">
            <div className="hdr">Home Clients</div>
            <div className="flex flex-row">
                  <form
        onSubmit={handleAddPost}
        className="p-6 w-full max-w-md rounded-xl shadow-md  text-white space-y-4"
      >
        <h2 className="text-xl font-bold">Add New Client</h2>

        <label className="form-control">
          <span className="label-text">Company Name</span>
          <input name="name" className="input input-bordered text-black" required />
        </label>

        <label className="form-control">
          <span className="label-text">Logo URL</span>
          <input name="logo" className="input input-bordered text-black" required />
        </label>

        <label className="form-control">
          <span className="label-text">Website Link</span>
          <input name="link" className="input input-bordered text-black" required />
        </label>

        <button className="btn btn-success w-full" type="submit">
          Add
        </button>
      </form>

      {/* Table Section */}
      <div className="overflow-x-auto w-full">
        <table className="table bg-white rounded-lg shadow">
          <thead className="bg-gray-100 font-bold text-black">
            <tr>
              <th>Logo</th>
              <th>Name</th>
              <th>Website</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((item) => (
              <tr key={item._id}>
                <td>
                  <img
                    src={item.logo}
                    className="w-12 h-12 rounded"
                    alt={item.name}
                  />
                </td>
                <td>{item.name}</td>
                <td>
                  <a
                    href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {item.link}
                  </a>
                </td>

                <td>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="btn btn-xs btn-error"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {clients.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-3">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
            </div>
    
    </div>
  );
};

export default AllHClient;
