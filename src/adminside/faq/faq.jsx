import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
const Faqall = () => {
  const [faqs, setFaqs] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`${base_url}/faq`)
      .then((res) => res.json())
      .then((data) => setFaqs(data))
      .catch((error) => console.error("Error fetching FAQs:", error));
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
        fetch(`${base_url}/delfaq/${_id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "FAQ deleted successfully.", "success");
              setFaqs((prev) => prev.filter((f) => f._id !== _id));
            }
          })
          .catch((error) => console.error("Error deleting FAQ:", error));
      }
    });
  };

  const handleAddPost = async (event) => {
    event.preventDefault();
    const form = event.target;
    const postData = {
      faqquestion: form.faqquestion.value.trim(),
      faqanswer: form.faqanswer.value.trim(),
    };

    try {
      const response = await fetch(`${base_url}/addfaq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      const data = await response.json();
      if (data.insertedId) {
        Swal.fire("New FAQ Added!", "Successfully added.", "success");
        form.reset();
        setShowForm(false);
        setFaqs([...faqs, { ...postData, _id: data.insertedId }]);
      } else {
        Swal.fire("Error!", "Failed to add FAQ.", "error");
      }
    } catch (error) {
      console.error("Error adding FAQ:", error);
      Swal.fire("Error!", "Unexpected error occurred.", "error");
    }
  };

  return (
     <div className="w-full">
            <div className='hdr'>Faqs</div>
    <div className="relative px-6 py-4">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="smbut"
        >
          + Add New FAQ
        </button>
      </div>

      {/* ===== FAQ TABLE ===== */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr className="text-center font-semibold">
              <th>Question</th>
              <th>Answer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {faqs.map((faq) => (
              <tr key={faq._id} className="text-center border-b">
                <td className="px-2 py-2">{faq.faqquestion}</td>
                <td className="px-2 py-2">{faq.faqanswer}</td>
                <td className="flex justify-center gap-2">
                  <Link
                    to={`/update/${faq._id}`}
                    className="btn btn-xs bg-blue-300 text-black"
                  >
                    Update
                  </Link>
                  <button
                    onClick={() => handleDelete(faq._id)}
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
              Add New FAQ
            </h3>
            <form onSubmit={handleAddPost} className="flex flex-col gap-3">
              <input
                name="faqquestion"
                type="text"
                placeholder="Question"
                className="input input-bordered w-full"
                required
              />
              <input
                name="faqanswer"
                type="text"
                placeholder="Answer"
                className="input input-bordered w-full"
                required
              />
              <button type="submit" className="btn btn-primary w-full mt-3">
                Add FAQ
              </button>
            </form>
          </div>
        </div>
      )}
    </div> </div>
  );
};

export default Faqall;
