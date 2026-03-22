import { useEffect, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
const Reviews = () => {
  const loaderreviews = useLoaderData();
  const [reviews, setReviews] = useState(loaderreviews || []);

  useEffect(() => {
    fetch(`${base_url}/clientfeedbacks`)
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch((error) => console.error("Error fetching feedbacks:", error));
  }, []);

  const handleDelete = (_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This feedback will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${base_url}/delreview/${_id}`, {
          method: "DELETE",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "Feedback deleted successfully.", "success");
              setReviews((prev) => prev.filter((r) => r._id !== _id));
            }
          })
          .catch((error) => console.error("Error deleting review:", error));
      }
    });
  };

 const handleStatusChange = (reviewId, newStatus) => {
  fetch(`${base_url}/clientfeedbacks/status/${reviewId}`, {
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

        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId ? { ...r, status: newStatus } : r
          )
        );
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
                    <div className='hdr'>Feedbacks</div>

      <div className="overflow-x-auto">
        <table className="table w-full border">
          <thead className="bg-gray-100">
            <tr className="font-semibold text-center">
              <th>Client</th>
              <th>Order ID</th>
              <th>Package ID</th>
              <th>Feedback</th>
              <th>Rating</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <tr key={review._id} className="text-center">
                  <td className="flex flex-col items-center justify-center py-2">
                    <img
                      src={
                        review.cdp ||
                        "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                      }
                      alt={review.cname}
                      className="h-12 w-12 rounded-full object-cover mb-1"
                    />
                    <span className="font-medium">{review.cname}</span>
                  </td>
                  <td>{review.orderid}</td>
                  <td>{review.packageId}</td>
                  <td className="max-w-xs text-sm">{review.tfeedback}</td>
                  <td>
                    {"⭐".repeat(review.rating || 0)}
                    <span className="text-gray-500 ml-1">
                      ({review.rating || 0})
                    </span>
                  </td>
                  <td>
                    {new Date(parseInt(review.createdAt)).toLocaleDateString()}
                  </td>

               <td className="py-2 px-3">
  <select
    value={review.status || "pending"}
    onChange={(e) => handleStatusChange(review._id, e.target.value)}
    className={`border rounded px-2 py-1 text-sm cursor-pointer ${
      review.status === "show"
        ? "bg-green-100 text-green-800"
        : review.status === "hide"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800"
    }`}
  >
    <option value="show">Show</option>
    <option value="hide">Hide</option>
  </select>
</td>


                  <td>
                    <Link
                      className="btn btn-xs bg-blue-300 text-black mr-2"
                      to={`/update/${review._id}`}
                    >
                      Update
                    </Link>
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="btn btn-xs btn-error text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  No feedbacks available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reviews;
