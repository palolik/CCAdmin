import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { MdChat } from "react-icons/md";
import AdminChat from './AdminChat';
import { base_url } from "../../config/config";

const statusColors = {
  pending:   "bg-yellow-100 text-yellow-800",
  approved:  "bg-blue-100 text-blue-800",
  started:   "bg-green-100 text-green-800",
  completed: "bg-purple-100 text-purple-800",
  rejected:  "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const stripHtml = (html) => {
  if (!html) return "—";
  return html.replace(/<[^>]*>/g, "").trim() || "—";
};

const CustomProjects = () => {
  const [requests, setRequests]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [editingId, setEditingId]         = useState(null);
  const [editForm, setEditForm]           = useState({});
  const [activeChatTasks, setActiveChatTasks] = useState([]);
  const [chatVisibility, setChatVisibility]   = useState({});

  // ── Render attachments ─────────────────────────────────────────────────────
  const renderAttachments = (attachments = []) => {
    if (!attachments.length) return <span className="text-gray-400 text-xs">No attachments</span>;
    return (
      <div className="flex flex-col gap-1">
        {attachments.map((url, i) => {
          const isImage = /\.(png|jpe?g|svg|webp)$/i.test(url);
          const isPDF   = /\.pdf$/i.test(url);
          return (
            <div key={i}>
              {isImage ? (
                <img src={url} alt={`attachment-${i}`} className="max-w-[80px] max-h-[80px] rounded border" />
              ) : isPDF ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs underline">
                  📄 View PDF {i + 1}
                </a>
              ) : (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs underline">
                  📎 Attachment {i + 1}
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Fetch all requests ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${base_url}/custom-package-requests`)
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => {
        console.error(err);
        Swal.fire("Error", "Failed to load custom package requests.", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Chat handlers ───────────────────────────────────────────────────────────
  const handleChatClick = (reqId) => {
    if (!activeChatTasks.includes(reqId)) {
      setActiveChatTasks(prev => [...prev, reqId]);
    }
    setChatVisibility(prev => ({ ...prev, [reqId]: true }));
  };

  const closeChat = (reqId) => {
    setActiveChatTasks(prev => prev.filter(id => id !== reqId));
    setChatVisibility(prev => {
      const updated = { ...prev };
      delete updated[reqId];
      return updated;
    });
  };

  const toggleChatVisibility = (reqId) => {
    setChatVisibility(prev => ({ ...prev, [reqId]: !prev[reqId] }));
  };

  // ── Edit handlers ───────────────────────────────────────────────────────────
  const handleEdit = (req) => {
    setEditingId(req._id);
    // Normalize packageContents — support both string[] and object[]
    const existingContents = (req.packageContents || []).map(item =>
      typeof item === "string" ? item : item.name
    );
    setEditForm({
      status:          req.status        || "pending",
      pstatus:         req.pstatus       || "notpaid",
      packagePrice:    req.packagePrice  || "",
      deliveryTime:    req.deliveryTime  || "",
      adminNote:       req.adminNote     || "",
      packageContents: existingContents.length > 0 ? existingContents : [""],
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (id) => {
    const payload = {
      ...editForm,
      // Convert string array to { id, name, isDone } objects
      packageContents: editForm.packageContents
        .filter(item => (typeof item === "string" ? item.trim() : item.name?.trim()))
        .map((item, i) =>
          typeof item === "string"
            ? { id: i + 1, name: item.trim(), isDone: false }
            : { ...item, id: i + 1 }
        ),
    };
    fetch(`${base_url}/custom-package-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        if (data.modifiedCount > 0 || data.acknowledged) {
          Swal.fire({ icon: "success", title: "Updated!", timer: 1200, showConfirmButton: false });
          setRequests(prev => prev.map(r => r._id === id ? { ...r, ...editForm } : r));
          setEditingId(null);
        }
      })
      .catch(() => Swal.fire("Error", "Failed to update request.", "error"));
  };

  const handleQuickStatus = (id, newStatus) => {
    fetch(`${base_url}/custom-package-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.modifiedCount > 0 || data.acknowledged) {
          Swal.fire({ icon: "success", title: "Status Updated!", text: `Changed to ${newStatus}`, timer: 1200, showConfirmButton: false });
          setRequests(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
        }
      })
      .catch(() => Swal.fire("Error", "Could not update status.", "error"));
  };

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;

  return (
    <div className="w-full">
      <div className="hdr">Custom Package Requests</div>

      <div className="overflow-x-auto w-full p-5">
        {requests.length === 0 ? (
          <p className="text-gray-400 text-center py-16">No custom package requests yet.</p>
        ) : (
          <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="border border-gray-300 px-3 py-2 whitespace-nowrap">Client</th>
                <th className="border border-gray-300 px-3 py-2 whitespace-nowrap">Package Name</th>
                <th className="border border-gray-300 px-3 py-2 whitespace-nowrap">Description</th>
                <th className="border border-gray-300 px-3 py-2 whitespace-nowrap">Offering Price</th>
                <th className="border border-gray-300 px-3 py-2 whitespace-nowrap">Deadline</th>
                <th className="border border-gray-300 px-3 py-2 whitespace-nowrap">Submitted</th>
                <th className="border border-gray-300 px-3 py-2 whitespace-nowrap">Status</th>
                <th className="border border-gray-300 px-3 py-2 whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((req) => (
                <>
                  {/* ── Main row ─────────────────────────────────────────── */}
                  <tr key={req._id} className="align-top hover:bg-gray-50 transition-colors">

                    {/* Client */}
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={req.requestedBy?.pic || "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 whitespace-nowrap">{req.requestedBy?.name || "—"}</p>
                          <p className="text-xs text-gray-400">{req.requestedBy?.email || "—"}</p>
                          <p className="text-xs text-gray-300">{req.requestedBy?.userId || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Package Name */}
                    <td className="border border-gray-300 px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      {req.packageName || "—"}
                    </td>

                    {/* Description */}
                    <td className="border border-gray-300 px-3 py-2 max-w-[260px]">
                      <p className="line-clamp-3 text-gray-600">{stripHtml(req.description)}</p>
                    </td>

                    {/* Offering Price */}
                    <td className="border border-gray-300 px-3 py-2 text-green-700 font-semibold whitespace-nowrap">
                      ${req.offeringPrice || "—"}
                    </td>

                    {/* Deadline */}
                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap text-gray-600">
                      {req.deliveryDeadline
                        ? new Date(req.deliveryDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>

                    {/* Submitted At */}
                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap text-gray-500 text-xs">
                      {formatDate(req.createdAt)}
                    </td>

                    {/* Status quick-select */}
                    <td className="border border-gray-300 px-3 py-2">
                      <select
                        value={req.status || "pending"}
                        onChange={(e) => handleQuickStatus(req._id, e.target.value)}
                        className={`border rounded px-2 py-1 text-xs cursor-pointer font-medium ${statusColors[req.status] || statusColors.pending}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="started">Started</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Action — Review + Chat */}
                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => editingId === req._id ? setEditingId(null) : handleEdit(req)}
                          className={`btn btn-xs ${editingId === req._id ? "bg-gray-200 text-gray-700" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                        >
                          {editingId === req._id ? "Close" : "Review"}
                        </button>
                        <button
                          className="btn btn-xs bg-blue-300 text-black"
                          onClick={() => handleChatClick(req._id)}
                        >
                          Chat <MdChat />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Expanded edit panel ───────────────────────────────── */}
                  {editingId === req._id && (
                    <tr key={`edit-${req._id}`}>
                      <td colSpan={8} className="border border-blue-200 bg-blue-50 px-5 py-4">
                        <div className="flex flex-col gap-4">

                          <p className="font-semibold text-blue-700 text-sm">📋 Full Description</p>
                          <div
                            className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 max-h-48 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: req.description || "No description provided." }}
                          />

                          {req.attachments?.length > 0 && (
                            <div>
                              <p className="font-semibold text-blue-700 text-sm mb-2">📎 Attachments</p>
                              {renderAttachments(req.attachments)}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Status</label>
                              <select
                                value={editForm.status}
                                onChange={(e) => handleEditChange("status", e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="started">Started</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>


                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Payment Status</label>
                              <select
                                value={editForm.pstatus}
                                onChange={(e) => handleEditChange("pstatus", e.target.value)}
                                className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium ${editForm.pstatus === "paid" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
                              >
                                <option value="notpaid">Not Paid</option>
                                <option value="paid">Paid</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Final Price ($)</label>
                              <input
                                type="number"
                                value={editForm.packagePrice}
                                onChange={(e) => handleEditChange("packagePrice", e.target.value)}
                                placeholder="e.g. 200"
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Delivery Time</label>
                              <input
                                type="text"
                                value={editForm.deliveryTime}
                                onChange={(e) => handleEditChange("deliveryTime", e.target.value)}
                                placeholder="e.g. 5 business days"
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Admin Note (visible to client)</label>
                              <input
                                type="text"
                                value={editForm.adminNote}
                                onChange={(e) => handleEditChange("adminNote", e.target.value)}
                                placeholder="Optional message to client"
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                            </div>
                          </div>

                          {/* Package Contents */}
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-gray-600">Package Contents</label>
                            {editForm.packageContents?.map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const updated = [...editForm.packageContents];
                                    updated[i] = e.target.value;
                                    handleEditChange("packageContents", updated);
                                  }}
                                  placeholder={`Content ${i + 1}`}
                                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                                {editForm.packageContents.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleEditChange("packageContents", editForm.packageContents.filter((_, idx) => idx !== i))}
                                    className="btn btn-xs btn-error text-white"
                                  >✕</button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleEditChange("packageContents", [...editForm.packageContents, ""])}
                              className="btn btn-xs btn-outline btn-info w-fit"
                            >+ Add Item</button>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn btn-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSave(req._id)}
                              className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Floating chat windows ─────────────────────────────────────────────── */}
      <div className="flex flex-row-reverse items-end fixed right-0 bottom-0 p-4">
        {activeChatTasks.map((reqId) => {
          const req = requests.find(r => r._id === reqId);
          return (
               <AdminChat
              key={reqId}
              orderId={reqId}
              bdp={req?.requestedBy?.pic}
              buyerid={req?.requestedBy?.userId}
              projectTitle={req?.packageName || 'Custom Request'}
              buyerName={req?.requestedBy?.name || 'Unknown'}
              projectDetails={stripHtml(req?.description) || 'No description'}
              packageContents={req?.packageContents || []}
              packageType="custom"
              isVisible={chatVisibility[reqId]}
              onClose={() => closeChat(reqId)}
              onToggle={() => toggleChatVisibility(reqId)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CustomProjects;