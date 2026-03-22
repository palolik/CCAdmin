import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
const AddSocial = () => {
  const [ima, setIma] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`${base_url}/socialmedia`)
      .then((res) => res.json())
      .then((data) => setIma(data))
      .catch((error) => console.error("Error fetching social links:", error));
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
        fetch(`${base_url}/delsocial/${_id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "The social link has been deleted.", "success");
              setIma((prev) => prev.filter((s) => s._id !== _id));
            }
          })
          .catch((error) => console.error("Error deleting social link:", error));
      }
    });
  };

  const handleAddPost = async (event) => {
    event.preventDefault();
    const form = event.target;
    const postData = {
      certilink: form.certilink.value.trim(),
      link: form.link.value.trim(),
    };

    try {
      const response = await fetch(`${base_url}/addsocial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      const data = await response.json();
      if (data.insertedId) {
        Swal.fire("New Social Media Added!", "Successfully added.", "success");
        form.reset();
        setShowForm(false);
        setIma([...ima, { ...postData, _id: data.insertedId }]);
      } else {
        Swal.fire("Error!", "Failed to add social media.", "error");
      }
    } catch (error) {
      console.error("Error adding social media:", error);
      Swal.fire("Error!", "Unexpected error occurred.", "error");
    }
  };

  return (
       <div className="w-full">
            <div className='hdr'>Services</div>

    <div className="relative px-6 py-4">
      <div className="flex justify-end items-center mb-4">
       
        <button
          onClick={() => setShowForm(true)}
          className="smbut"
        >
          + Add New Social Media
        </button>
      </div>

      {/* ===== SOCIAL MEDIA TABLE ===== */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr className="text-center font-semibold">
              <th>Image</th>
              <th>Social Media Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ima.map((social) => (
              <tr key={social._id} className="text-center border-b">
                <td className="flex justify-center">
                  <img
                    src={social.certilink}
                    alt="Social"
                    className="w-12 h-12 object-cover rounded-full"
                  />
                </td>
                <td className="truncate max-w-xs">{social.link}</td>
                <td className="flex justify-center gap-2">
                  <button
                    onClick={() => handleDelete(social._id)}
                    className="btn btn-xs btn-error"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== FLOATING FORM MODAL ===== */}
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
              Add New Social Media
            </h3>
            <form onSubmit={handleAddPost} className="flex flex-col gap-3">
              <input
                name="certilink"
                type="text"
                placeholder="Image URL"
                className="input input-bordered w-full"
                required
              />
              <input
                name="link"
                type="text"
                placeholder="Social Media Link"
                className="input input-bordered w-full"
                required
              />
              <button type="submit" className="btn btn-primary w-full mt-3">
                Add Social Media
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
     </div>
  );
};

export default AddSocial;
