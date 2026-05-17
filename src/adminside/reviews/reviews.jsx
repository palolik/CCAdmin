import { useEffect, useMemo, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import Swal from "sweetalert2";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { base_url } from "../../config/config";

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
];

const Reviews = () => {
  const loaderreviews = useLoaderData();
  const [reviews, setReviews] = useState(loaderreviews || []);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch(`${base_url}/clientfeedbacks`)
    .then((res) => res.json())
    .then((data) => setReviews(data))
    .catch((error) => console.error("Error fetching feedbacks:", error))
    .finally(() => setLoading(false));
}, []);

  const reviewStatsByPackage = useMemo(() => {
    const grouped = reviews.reduce((acc, review) => {
      const packageName =
        review.packageName || review.packageId || "Unknown Package";

      const rating = Number(review.rating || 0);

      if (!acc[packageName]) {
        acc[packageName] = {
          packageName,
          shortPackageName:
            packageName.length > 18
              ? `${packageName.slice(0, 18)}...`
              : packageName,
          totalRating: 0,
          totalReviews: 0,
          averageRating: 0,
        };
      }

      acc[packageName].totalRating += rating;
      acc[packageName].totalReviews += 1;
      acc[packageName].averageRating = Number(
        (acc[packageName].totalRating / acc[packageName].totalReviews).toFixed(2)
      );

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => b.averageRating - a.averageRating
    );
  }, [reviews]);

  const formatDate = (createdAt) => {
    if (!createdAt) return "N/A";

    const numericDate = Number(createdAt);
    const date = !isNaN(numericDate)
      ? new Date(numericDate)
      : new Date(createdAt);

    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString();
  };

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
      headers: {
        "Content-Type": "application/json",
      },
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
            prev.map((review) =>
              review._id === reviewId
                ? { ...review, status: newStatus }
                : review
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

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 animate-pulse">
        Loading reviews...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hdr">Reviews</div>

      {/* Average Review Graph + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5">
        {/* Graph */}
        <div className="bg-white shadow-lg rounded-xl p-5 border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Average Reviews by Package
            </h2>

            <span className="text-sm font-bold text-indigo-600">
              {reviewStatsByPackage.length} Packages
            </span>
          </div>

          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviewStatsByPackage}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="shortPackageName"
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11 }}
                />

                <YAxis domain={[0, 5]} />

                <Tooltip
                  formatter={(value) => [`${value} ⭐`, "Average Rating"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.packageName || "Package"
                  }
                />

                <Bar dataKey="averageRating" radius={[6, 6, 0, 0]}>
                  {reviewStatsByPackage.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white shadow-lg rounded-xl p-5 border overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Review Summary Table
          </h2>

          <table className="table w-full border">
            <thead className="bg-gray-100">
              <tr className="text-center">
                <th>Package Name</th>
                <th>Total Reviews</th>
                <th>Average Rating</th>
              </tr>
            </thead>

            <tbody>
              {reviewStatsByPackage.length > 0 ? (
                reviewStatsByPackage.map((item) => (
                  <tr key={item.packageName} className="text-center">
                    <td className="text-sm font-medium text-gray-700">
                      {item.packageName}
                    </td>

                    <td>{item.totalReviews}</td>

                    <td>
                      <span className="font-semibold text-yellow-600">
                        {item.averageRating}
                      </span>{" "}
                      ⭐
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-6 text-gray-500">
                    No review statistics available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Reviews Table */}
      <div className="overflow-x-auto px-5 pb-5">
        <table className="table w-full border">
          <thead className="bg-gray-100">
            <tr className="font-semibold text-center">
              <th>Client</th>
              <th>Order / Package</th>
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
                      alt={review.cname || "Client"}
                      className="h-12 w-12 rounded-full object-cover mb-1"
                    />

                    <span className="font-medium">
                      {review.cname || "Unknown Client"}
                    </span>
                  </td>

                  <td>
                    <p className="font-medium text-gray-700">
                      Order: {review.orderid || "N/A"}
                    </p>

                    <p className="text-sm text-indigo-600 font-semibold">
                      {review.packageName || "Unknown Package"}
                    </p>

                    <p className="text-xs text-gray-400">
                      {review.packageCategory || ""}
                    </p>
                  </td>

                  <td className="max-w-xs text-sm">
                    {review.tfeedback || "No feedback"}
                  </td>

                  <td>
                    {"⭐".repeat(Number(review.rating || 0))}

                    <span className="text-gray-500 ml-1">
                      ({review.rating || 0})
                    </span>
                  </td>

                  <td>{formatDate(review.createdAt)}</td>

                  <td className="py-2 px-3">
                    <select
                      value={review.status || "pending"}
                      onChange={(e) =>
                        handleStatusChange(review._id, e.target.value)
                      }
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
                <td colSpan="7" className="text-center py-6 text-gray-500">
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