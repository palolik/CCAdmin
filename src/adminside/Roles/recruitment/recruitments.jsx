import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { base_url } from "../../../config/config";
const RecruitmentAdmin = () => {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [deadline, setDeadline] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  useEffect(() => {
    fetch(`${base_url}/recruitment`)
      .then((res) => res.json())
      .then((data) => setJobs(data))
      .catch((error) => console.error("Error fetching recruitment posts:", error));
  }, []);

  const handleDelete = (_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This job post will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${base_url}/delrecruit/${_id}`, {
          method: "DELETE",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "Recruitment post deleted successfully.", "success");
              setJobs((prev) => prev.filter((j) => j._id !== _id));
            }
          })
          .catch((error) => console.error("Error deleting recruitment post:", error));
      }
    });
  };

  const handleAddPost = async (event) => {
    event.preventDefault();

    const newPost = {
      title: title.trim(),
      department: department.trim(),
      deadline: deadline.trim(),
      salary: salary.trim(),
      description,
      requirements,
    };

    try {
      const response = await fetch(`${base_url}/addrecruit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      const data = await response.json();

      if (data.insertedId) {
        Swal.fire("Success!", "Recruitment post added successfully.", "success");
        setShowForm(false);
        setJobs([...jobs, { ...newPost, _id: data.insertedId }]);
        // reset form
        setTitle("");
        setDepartment("");
        setDeadline("");
        setSalary("");
        setDescription("");
        setRequirements("");
      } else {
        Swal.fire("Error!", "Failed to add recruitment post.", "error");
      }
    } catch (error) {
      console.error("Error adding recruitment post:", error);
      Swal.fire("Error!", "An unexpected error occurred.", "error");
    }
  };

  return (
    <div className="w-full">
      <div className="hdr">Recruitment Management</div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="smbut"
        >
          + Add New Recruitment
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr className="text-center font-semibold">
              <th>Title</th>
              <th>Department</th>
              <th>apply deadline</th>
              <th>Salary</th>
              <th>Description</th>
              <th>Requirements</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id} className="text-center border-b">
                <td className="font-semibold">{job.title}</td>
                <td>{job.department}</td>
                <td>{job.deadline}</td>
                <td>{job.salary}</td>
                <td className="max-w-xs truncate"> <div
                className="prose max-w-none text-gray-700 leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6"
                dangerouslySetInnerHTML={{ __html: job.description }}
              /></td>
                <td className="max-w-xs truncate"> <div
                className="prose max-w-none text-gray-700 leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6"
                dangerouslySetInnerHTML={{ __html: job.requirements }}
              /></td>
                <td>
                  <Link
                    className="btn btn-xs bg-blue-300 text-black mr-2"
                    to={`/update-recruit/${job._id}`}
                  >
                    Update
                  </Link>
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="btn btn-xs btn-error text-white"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {jobs.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No recruitment posts available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold mb-4 text-center">
              Add New Recruitment Post
            </h3>

            <form onSubmit={handleAddPost} className="flex flex-col gap-3">
              <input
                name="title"
                type="text"
                placeholder="Job Title"
                className="input input-bordered w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                name="department"
                type="text"
                placeholder="Department"
                className="input input-bordered w-full"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
              <input
  name="deadline"
  type="date"
  className="input input-bordered w-full"
  value={deadline}
  onChange={(e) => setDeadline(e.target.value)} // ✅ FIXED
  required
/>

              <input
                name="salary"
                type="text"
                placeholder="Salary Range"
                className="input input-bordered w-full"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
              <label className="font-semibold mt-3">Job Description</label>
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                className="bg-white rounded-lg w-full h-[120px]"
              />

              <label className="font-semibold mt-3">Requirements</label>
              <ReactQuill
                theme="snow"
                value={requirements}
                onChange={setRequirements}
                className="bg-white rounded-lg w-full h-[120px]"
              />

              <button type="submit" className="btn btn-primary w-full mt-3">
                Add Recruitment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentAdmin;
