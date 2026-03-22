import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { RiCloseLargeFill } from "react-icons/ri";
import { base_url } from "../../config/config";

const emptyForm = { method: "", number: "", extradetails: "" };

const PaymentMethod = () => {
  const [payments, setPayments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(emptyForm);

  useEffect(() => {
    fetch(`${base_url}/payment`)
      .then((res) => res.json())
      .then((data) => setPayments(data))
      .catch((err) => console.error("Error fetching payments:", err));
  }, []);

  const handleDelete = (_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${base_url}/delpayment/${_id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire("Deleted!", "Payment method deleted.", "success");
              setPayments((prev) => prev.filter((p) => p._id !== _id));
            }
          });
      }
    });
  };

  const buildData = (form) => ({
    method: form.method.value.trim(),
    number: form.number.value.trim(),
    extradetails: form.extradetails.value.trim(),
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    const postData = buildData(e.target);
    try {
      const res = await fetch(`${base_url}/addpayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      const data = await res.json();
      if (data.insertedId) {
        Swal.fire("Added!", "Payment method added.", "success");
        setPayments([...payments, { ...postData, _id: data.insertedId }]);
        e.target.reset();
        setShowAddModal(false);
      }
    } catch {
      Swal.fire("Error!", "Something went wrong.", "error");
    }
  };

  const handleEdit = (item) => {
    setEditData(item);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const updatedData = buildData(e.target);
    try {
      const res = await fetch(`${base_url}/editpayment/${editData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      if (data.message === "Payment updated successfully") {
        Swal.fire("Updated!", "Payment method updated.", "success");
        setPayments(payments.map((p) =>
          p._id === editData._id ? { ...p, ...updatedData } : p
        ));
        setShowEditModal(false);
      }
    } catch {
      Swal.fire("Error!", "Something went wrong.", "error");
    }
  };

  const PaymentForm = ({ onSubmit, defaultValues = {}, submitLabel }) => (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flbl">
        <span>Payment Method</span>
        <select name="method" defaultValue={defaultValues.method || ""} className="fflin" required>
          <option value="" disabled>Select method</option>
          <option value="bKash">bKash</option>
          <option value="Nagad">Nagad</option>
          <option value="Rocket">Rocket</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cash on Delivery">Cash on Delivery</option>
          <option value="Card">Card</option>
          <option value="Other">Other</option>
        </select>
      </label>
      <label className="flbl">
        <span>Number / Account</span>
        <input
          name="number"
          type="text"
          defaultValue={defaultValues.number}
          className="fflin"
          placeholder="e.g. 01XXXXXXXXX"
          required
        />
      </label>
      <label className="flbl">
        <span>Extra Details</span>
        <textarea
          name="extradetails"
          defaultValue={defaultValues.extradetails}
          className="fflin h-24 resize-none"
          placeholder="e.g. Send money to personal, mention order ID"
        />
      </label>
      <button type="submit" className="btn btn-sm btn-primary mt-2 w-full">
        {submitLabel}
      </button>
    </form>
  );

  return (
    <div className="w-full">
      <div className="hdr">Payment Methods</div>

      <div className="px-6 py-4">
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowAddModal(true)} className="smbut">
            + Add Payment Method
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-auto w-full border text-sm">
            <thead className="bg-gray-100">
              <tr className="text-center font-semibold">
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Number / Account</th>
                <th className="px-3 py-2">Extra Details</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-400">
                    No payment methods added yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="text-center border-b hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">{p.number}</td>
                    <td className="px-3 py-2 text-gray-500 text-left max-w-[240px] truncate">{p.extradetails || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(p)} className="smbut">Edit</button>
                        <button onClick={() => handleDelete(p._id)} className="smbut">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Payment Method</h3>
              <button onClick={() => setShowAddModal(false)} className="close-btn">
                <RiCloseLargeFill />
              </button>
            </div>
            <PaymentForm onSubmit={handleAdd} submitLabel="Add Method" />
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Payment Method</h3>
              <button onClick={() => setShowEditModal(false)} className="close-btn">
                <RiCloseLargeFill />
              </button>
            </div>
            <PaymentForm onSubmit={handleEditSubmit} defaultValues={editData} submitLabel="Update Method" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethod;