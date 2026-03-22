import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
const Teamadmin = () => {
  const [team, setTeam] = useState([]);
  const [showForm, setShowForm] = useState(false); 

  useEffect(() => {
    fetch(`${base_url}/team`)
      .then((res) => res.json())
      .then((data) => setTeam(data))
      .catch((error) => console.error("Error fetching team:", error));
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
        fetch(`${base_url}/delteam/${_id}`, {
          method: "DELETE",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "The team member has been deleted.", "success");
              setTeam((prev) => prev.filter((m) => m._id !== _id));
            }
          })
          .catch((error) => console.error("Error deleting team member:", error));
      }
    });
  };

  const handleAddPost = async (event) => {
    event.preventDefault();
    const form = event.target;

    const postData = {
      piclink: form.piclink.value.trim(),
      name: form.name.value.trim(),
      rank: form.rank.value.trim(),
      designation: form.designation.value.trim(),
      bio: form.bio.value.trim(),
    };

    try {
      const response = await fetch(`${base_url}/addteam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (data.insertedId) {
        Swal.fire("New Team Member Added!", "Added successfully.", "success");
        form.reset();
        setShowForm(false); 
        setTeam([...team, { ...postData, _id: data.insertedId }]);
      } else {
        Swal.fire("Error!", "There was an issue adding the member.", "error");
      }
    } catch (error) {
      console.error("Error adding team member:", error);
      Swal.fire("Error!", "An unexpected error occurred.", "error");
    }
  };

  return (
    <div className="w-full">
    <div className='hdr'>Our Team</div>
    <div className="flex justify-end items-center mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="smbut"
        >
          + Add New Member
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr className="text-center font-semibold">
              <th>Picture</th>
              <th>Name</th>
              <th>Rank</th>
              <th>Designation</th>
              <th>Bio</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member._id} className="text-center border-b">
                <td>
                  <img
                    src={member.piclink}
                    alt={member.name}
                    className="w-16 h-16 object-cover rounded-full mx-auto"
                  />
                </td>
                <td>{member.name}</td>
                <td>{member.rank}</td>
                <td>{member.designation}</td>
                <td className="max-w-xs truncate">{member.bio}</td>
                <td>
                  <Link
                    className="btn btn-xs bg-blue-300 text-black mr-2"
                    to={`/update/${member._id}`}
                  >
                    Update
                  </Link>
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="btn btn-xs btn-error text-white"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
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
              Add New Team Member
            </h3>
            <form onSubmit={handleAddPost} className="flex flex-col gap-3">
              <input name="piclink" type="text" placeholder="Picture URL" className="input input-bordered w-full" required />
              <input name="name" type="text" placeholder="Full Name" className="input input-bordered w-full" required />
              <input name="rank" type="text" placeholder="Rank" className="input input-bordered w-full" required />
              <input name="designation" type="text" placeholder="Designation" className="input input-bordered w-full" required />
              <textarea name="bio" placeholder="Short Bio" className="textarea textarea-bordered w-full" required></textarea>
              <button type="submit" className="btn btn-primary w-full mt-3">
                Add Member
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teamadmin;
