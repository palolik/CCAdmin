import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
const Marketing = () => {
  const [referrals, setReferrals] = useState([]);

  // Fetch data
  useEffect(() => {
    fetch(`${base_url}/marketing`)
      .then((res) => res.json())
      .then((data) => setReferrals(data))
      .catch((error) => console.error("Error fetching marketing data:", error));
  }, []);

  // Delete a referral entry
  const handleDelete = (_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${base_url}/delmarketing/${_id}`, {
          method: "DELETE",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "Referral record deleted.", "success");
              setReferrals((prev) => prev.filter((item) => item._id !== _id));
            }
          })
          .catch((error) => console.error("Error deleting referral:", error));
      }
    });
  };

  return (
    <div className="w-full">
      <div className="hdr">Marketing Referrals</div>
      <div className="relative px-6 py-4">
        {/* ===== REFERRAL TABLE ===== */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full border">
            <thead className="bg-gray-100">
              <tr className="text-center font-semibold">
                <th>Name</th>
                <th>Referral Code</th>
                <th>Coupon Code</th>
                <th>Referral Count</th>
                <th>Coupon Used</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {referrals.map((ref) => (
                <tr key={ref._id} className="text-center border-b">
                  <td className="px-2 py-2">{ref.rname}</td>
                  <td className="px-2 py-2">{ref.referralCode}</td>
                  <td className="px-2 py-2">{ref.couponCode}</td>
                  <td className="px-2 py-2">{ref.referralCount}</td>
                  <td className="px-2 py-2">{ref.couponCount}</td>
                  <td className="px-2 py-2">
                    {ref.createdAt
                      ? new Date(ref.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="flex justify-center gap-2">
                    <button
                      onClick={() => handleDelete(ref._id)}
                      className="btn btn-xs btn-error"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {referrals.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500">
                    No referral data found.
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

export default Marketing;
