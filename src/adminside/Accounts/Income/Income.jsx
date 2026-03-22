import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { base_url } from "../../../config/config";

const CATEGORIES = ["General", "Service", "Freelance", "Bonus", "Refund", "Other"];

const emptyForm = { title: "", amount: "", category: "General", note: "" };

const Income = () => {
  const [activeTab, setActiveTab]     = useState("auto");   // "auto" | "manual"
  const [incomeData, setIncomeData]   = useState([]);
  const [manualData, setManualData]   = useState([]);
  const [loading, setLoading]         = useState(true);

  // modal state
  const [showModal, setShowModal]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null);     // null = add, obj = edit
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);

  // ── Loaders ────────────────────────────────
  const loadAuto = async () => {
    const res  = await fetch(`${base_url}/income`);
    const data = await res.json();
    setIncomeData(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  const loadManual = async () => {
    const res  = await fetch(`${base_url}/manual-income`);
    const data = await res.json();
    setManualData(data);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([loadAuto(), loadManual()]);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load income data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Totals ─────────────────────────────────
  const autoTotal   = incomeData.reduce((s, i) => s + Number(i.sellPrice  || 0), 0);
  const manualTotal = manualData.reduce((s, i) => s + Number(i.amount     || 0), 0);
  const grandTotal  = autoTotal + manualTotal;

  // ── Modal helpers ──────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({ title: item.title, amount: item.amount, category: item.category, note: item.note || "" });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTarget(null); };

  const handleFormChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Save (add / edit) ──────────────────────
  const handleSave = async () => {
    if (!form.title.trim() || !form.amount) {
      Swal.fire("Validation", "Title and Amount are required.", "warning");
      return;
    }
    try {
      setSaving(true);
      const isEdit = !!editTarget;
      const url    = isEdit ? `${base_url}/manual-income/${editTarget._id}` : `${base_url}/manual-income`;
      const method = isEdit ? "PUT" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire("Success", isEdit ? "Entry updated!" : "Entry added!", "success");
        closeModal();
        loadManual();
      } else {
        Swal.fire("Error", data.message || "Something went wrong", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Request failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete this entry?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#ef4444",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res  = await fetch(`${base_url}/manual-income/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        Swal.fire("Deleted", "Entry removed.", "success");
        loadManual();
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", "Delete failed", "error");
    }
  };

  // ── Export ─────────────────────────────────
  const exportToExcel = () => {
    const autoRows = incomeData.map(i => ({
      Type:          "Auto (Order)",
      Title:         i.packageName    || "",
      Buyer:         i.buyername      || i.buyerid || "",
      Email:         i.email          || "",
      Project:       i.projectTitle   || "",
      Category:      "Order",
      Amount:        Number(i.sellPrice || 0).toFixed(2),
      PaymentMethod: i.paymentMethod  || "",
      PaymentStatus: i.paymentStatus  || "",
      TrxID:         i.transactionId  || "",
      Status:        i.status         || "",
      Date:          i.createdAt ? new Date(i.createdAt).toLocaleString() : "",
      Note:          "",
    }));

    const manualRows = manualData.map(i => ({
      Type:          "Manual",
      Title:         i.title          || "",
      Buyer:         "",
      Email:         "",
      Project:       "",
      Category:      i.category       || "",
      Amount:        Number(i.amount  || 0).toFixed(2),
      PaymentMethod: "",
      PaymentStatus: "",
      TrxID:         "",
      Status:        "",
      Date:          i.createdAt ? new Date(i.createdAt).toLocaleString() : "",
      Note:          i.note           || "",
    }));

    const ws = XLSX.utils.json_to_sheet([...autoRows, ...manualRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Income Data");
    XLSX.writeFile(wb, "income_data.xlsx");
  };

  // ── UI ─────────────────────────────────────
  return (
    <div className="w-full">
      <div className="hdr">Income Records</div>

      <div className="px-6 py-4">

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Order Income",  value: autoTotal,   color: "bg-blue-50 border-blue-200"  },
            { label: "Manual Income", value: manualTotal, color: "bg-green-50 border-green-200" },
            { label: "Grand Total",   value: grandTotal,  color: "bg-slate-100 border-slate-300 font-bold" },
          ].map(c => (
            <div key={c.label} className={`rounded-lg border px-4 py-3 ${c.color}`}>
              <p className="text-xs text-gray-500 mb-1">{c.label}</p>
              <p className={`text-lg ${c.color.includes("bold") ? "font-bold" : "font-semibold"} text-gray-800`}>
                {c.value.toFixed(2)} BDT
              </p>
            </div>
          ))}
        </div>

        {/* ── Tabs + actions ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {["auto", "manual"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab === "auto" ? "Order Income" : "Manual Income"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {activeTab === "manual" && (
              <button
                onClick={openAdd}
                className="smbut bg-green-500 hover:bg-green-600 text-white"
              >
                + Add Entry
              </button>
            )}
            <button className="smbut" onClick={exportToExcel}>
              Export to Excel
            </button>
          </div>
        </div>

        {/* ── Tables ── */}
        {loading ? (
          <div className="py-10 text-center text-gray-400">Loading...</div>
        ) : activeTab === "auto" ? (

          /* ── Auto income table ── */
          incomeData.length === 0 ? (
            <div className="py-10 text-center text-gray-400">No order income found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr className="text-center font-semibold text-gray-600">
                    <th className="px-2 py-2">Package</th>
                    <th className="px-2 py-2">Buyer</th>
                    <th className="px-2 py-2">Email</th>
                    <th className="px-2 py-2">Project</th>
                    <th className="px-2 py-2">Amount</th>
                    <th className="px-2 py-2">Payment</th>
                    <th className="px-2 py-2">Pay Status</th>
                    <th className="px-2 py-2">Order Status</th>
                    <th className="px-2 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeData.map(income => (
                    <tr key={income._id} className="text-center border-b hover:bg-gray-50">
                      <td className="px-2 py-2">{income.packageName}</td>
                      <td className="px-2 py-2">{income.buyername || income.buyerid}</td>
                      <td className="px-2 py-2 text-xs text-gray-500">{income.email}</td>
                      <td className="px-2 py-2 text-xs">{income.projectTitle}</td>
                      <td className="px-2 py-2 font-medium">{Number(income.sellPrice).toFixed(2)} BDT</td>
                      <td className="px-2 py-2 text-xs">{income.paymentMethod || "—"}</td>
                      <td className="px-2 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          income.paymentStatus === "Verified"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {income.paymentStatus || "—"}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {income.status ? income.status.charAt(0).toUpperCase() + income.status.slice(1) : "—"}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-500">
                        {income.createdAt ? new Date(income.createdAt).toLocaleDateString() : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )

        ) : (

          /* ── Manual income table ── */
          manualData.length === 0 ? (
            <div className="py-10 text-center text-gray-400">No manual entries yet. Add one!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr className="text-center font-semibold text-gray-600">
                    <th className="px-2 py-2">Title</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Amount</th>
                    <th className="px-2 py-2">Note</th>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {manualData.map(item => (
                    <tr key={item._id} className="text-center border-b hover:bg-gray-50">
                      <td className="px-2 py-2 font-medium">{item.title}</td>
                      <td className="px-2 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-2 py-2 font-medium">{Number(item.amount).toFixed(2)} BDT</td>
                      <td className="px-2 py-2 text-xs text-gray-500">{item.note || "—"}</td>
                      <td className="px-2 py-2 text-xs text-gray-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-xs px-3 py-1 rounded bg-red-100 text-red-500 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editTarget ? "Edit Entry" : "Add Manual Income"}
            </h2>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Client advance payment"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount (BDT) *</label>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Note</label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleFormChange}
                  placeholder="Optional note..."
                  rows={3}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : editTarget ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;