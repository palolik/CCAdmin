import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
const Coupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Load coupons
  useEffect(() => {
    fetch(`${base_url}/couponshow`)
      .then((res) => res.json())
      .then((data) => setCoupons(data))
      .catch((error) => console.error("Error fetching coupons:", error));
  }, []);

  // Delete coupon
  const handleDelete = (_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won’t be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${base_url}/delcoupon/${_id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "Coupon deleted successfully.", "success");
              setCoupons((prev) => prev.filter((c) => c._id !== _id));
            }
          })
          .catch((error) => console.error("Error deleting coupon:", error));
      }
    });
  };

  // Add coupon
  const handleAddPost = async (event) => {
    event.preventDefault();
    const form = event.target;

    const postData = {
      couponname: form.couponname.value.trim(),
      couponcode: form.couponcode.value.trim(),
      discount: form.discount.value.trim(),
      coupontotal: form.coupontotal.value.trim(),
      coupondate: form.coupondate.value, // date picker gives ISO format
    };

    try {
      const response = await fetch(`${base_url}/addcoupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const data = await response.json();
      if (data.insertedId) {
        Swal.fire("New Coupon Added!", "Successfully added.", "success");
        setShowForm(false);
        form.reset();
        setCoupons([...coupons, { ...postData, _id: data.insertedId, usedCount: 0, remaining: postData.coupontotal }]);
      } else {
        Swal.fire("Error!", "Failed to add coupon.", "error");
      }
    } catch (error) {
      console.error("Error adding coupon:", error);
      Swal.fire("Error!", "Unexpected error occurred.", "error");
    }
  };

  return (
    <div className="w-full">
      <div className="hdr">Coupons</div>

      <div className="relative px-6 py-4">
        {/* ===== Header ===== */}
        <div className="flex justify-end items-center mb-4">
          <button
            onClick={() => setShowForm(true)}
            className="smbut"
          >
            + Add New Coupon
          </button>
        </div>

        {/* ===== COUPON TABLE ===== */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full border">
            <thead className="bg-gray-100">
              <tr className="text-center font-semibold">
                <th>Name</th>
                <th>Code</th>
                <th>Total</th>
                <th>Used</th>
                <th>Remaining</th>
                <th>Discount (%)</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon._id} className="text-center border-b">
                    <td className="px-2 py-2">{coupon.couponname}</td>
                    <td className="px-2 py-2 font-mono">{coupon.couponcode}</td>
                    <td className="px-2 py-2">{coupon.coupontotal}</td>
                    <td className="px-2 py-2 text-blue-600 font-semibold">{coupon.usedCount || 0}</td>
                    <td className="px-2 py-2 text-green-600 font-semibold">{coupon.remaining ?? "N/A"}</td>
                    <td className="px-2 py-2">{coupon.discount}</td>
                    <td className="px-2 py-2">
                      {new Date(coupon.coupondate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="flex justify-center gap-2 py-2">
                      <Link
                        to={`/update/${coupon._id}`}
                        className="btn btn-xs bg-blue-300 text-black"
                      >
                        Update
                      </Link>
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="btn btn-xs btn-error"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===== FORM MODAL ===== */}
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
                Add New Coupon
              </h3>
              <form onSubmit={handleAddPost} className="flex flex-col gap-3">
                <input name="couponname" type="text" placeholder="Coupon Name" className="input input-bordered w-full" required />
                <input name="couponcode" type="text" placeholder="Coupon Code" className="input input-bordered w-full" required />
                <input name="discount" type="number" placeholder="Discount (%)" className="input input-bordered w-full" required />
                <input name="coupontotal" type="number" placeholder="Total Coupons" className="input input-bordered w-full" required />

                <label className="text-sm text-gray-600 font-semibold">Deadline</label>
                <input name="coupondate" type="date" className="input input-bordered w-full" required />

                <button type="submit" className="btn btn-primary w-full mt-3">
                  Add Coupon
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupon;
