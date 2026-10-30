/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLoaderData } from "react-router-dom";
import { MdChat, MdClose, MdAccessTime, MdTimerOff } from "react-icons/md";
import AdminChat from './AdminChat';
import Swal from 'sweetalert2';
import { base_url } from "../../config/config";

// Board columns, left to right. Dragging a card calls the same status
// endpoint the old dropdown did, so the client still gets their push.
const columns = [
  { status: "pending",   title: "Pending",   dot: "bg-amber-500" },
  { status: "started",   title: "Active",    dot: "bg-blue-600" },
  { status: "completed", title: "Completed", dot: "bg-green-600" },
  { status: "rejected",  title: "Rejected",  dot: "bg-red-500" },
];
const columnOf = (order) => (columns.some(c => c.status === order.status) ? order.status : order.status === "cancelled" ? "rejected" : "pending");

const statusConfig = {
  pending:   { label: "Pending",   color: "bg-slate-100 text-slate-600 border-slate-200" },
  started:   { label: "Active",    color: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", color: "bg-blue-600 text-white border-blue-600" },
  rejected:  { label: "Rejected",  color: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-500 border-slate-200" },
};

const pstatusConfig = {
  notpaid: { label: "Unpaid", color: "bg-red-50 text-red-700 border-red-200" },
  paid:    { label: "Paid",   color: "bg-blue-600 text-white border-blue-600" },
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });
};

const deadlineOf = (order) => new Date(order.startedAt).getTime() + Number(order.time) * 86400000;

const progressOf = (contents = []) => {
  const done = contents.filter(c => c.isDone).length;
  return { done, total: contents.length, percent: contents.length ? Math.round((done / contents.length) * 100) : 0 };
};

// ── Countdown box for active cards (green → amber → red) ──────
const TimeLeft = ({ order, now }) => {
  const left = deadlineOf(order) - now;
  if (left <= 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700">
        <MdTimerOff size={15} /> Past delivery date
      </div>
    );
  }
  const total = Number(order.time) * 86400000;
  const fraction = total > 0 ? Math.min(1, left / total) : 1;
  const tone = fraction > 0.5
    ? { box: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" }
    : fraction > 0.2
    ? { box: "bg-amber-50 border-amber-200", text: "text-amber-700", bar: "bg-amber-500" }
    : { box: "bg-red-50 border-red-200", text: "text-red-700", bar: "bg-red-500" };
  const pad = (n) => String(n).padStart(2, "0");
  const units = [
    [Math.floor(left / 86400000), "d"],
    [Math.floor((left % 86400000) / 3600000), "h"],
    [Math.floor((left % 3600000) / 60000), "m"],
    [Math.floor((left % 60000) / 1000), "s"],
  ];
  if (units[0][0] === 0) units.shift();

  return (
    <div className={`rounded-md border px-2.5 py-2 ${tone.box}`}>
      <div className={`flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider ${tone.text}`}>
        <span className="flex items-center gap-1"><MdAccessTime size={13} /> Time left</span>
        <span>{Math.round(fraction * 100)}%</span>
      </div>
      <div className="flex items-end gap-1 mt-1.5">
        {units.map(([value, unit], i) => (
          <div key={unit} className="flex items-baseline">
            <span className="bg-white rounded px-1.5 py-0.5 text-sm font-bold text-gray-800 tabular-nums shadow-sm">{i === 0 ? value : pad(value)}</span>
            <span className={`ml-0.5 text-[10px] font-medium ${tone.text}`}>{unit}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/80 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${tone.bar}`} style={{ width: `${fraction * 100}%` }} />
      </div>
    </div>
  );
};

// ── Deliverables checklist; admin can tick items ──────────────
const Checklist = ({ order, onToggle, compact = false }) => {
  const contents = order.packageContents || [];
  if (!contents.length) return null;
  const progress = progressOf(contents);
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${progress.percent === 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${progress.percent}%` }} />
        </div>
        <span className="text-[11px] text-gray-500">{progress.done}/{progress.total}</span>
      </div>
      <ul className={compact ? "space-y-1" : "space-y-1.5"}>
        {contents.map((item, i) => (
          <li key={i}>
            <label className="flex items-center gap-2 cursor-pointer select-none" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={Boolean(item.isDone)}
                onChange={() => onToggle(order._id, i)}
                className="w-3.5 h-3.5 accent-green-600 cursor-pointer"
              />
              <span className={`${compact ? "text-xs" : "text-sm"} ${item.isDone ? "text-gray-400 line-through" : "text-gray-700"}`}>{item.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Projects = () => {
  const loaderorders = useLoaderData();

  const [orders, setOrders] = useState(
    [...(loaderorders || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );
  const [now, setNow] = useState(Date.now());
  const [chatVisibility, setChatVisibility] = useState({});
  const [activeChatTasks, setActiveChatTasks] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [search, setSearch] = useState("");
  const [openOrderId, setOpenOrderId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);

  const ordersRef = useRef([]);
  ordersRef.current = orders;

  /* ── fetch orders ── */
  const loadP = () => {
    fetch(`${base_url}/orders`)
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sorted);
      })
      .catch(err => console.error('Error fetching orders:', err));
  };

  /* ── fetch unread counts for all orders ── */
  const loadUnreadCounts = async () => {
    try {
      const results = await Promise.all(
        ordersRef.current.map(async (order) => {
          try {
            const r = await fetch(`${base_url}/clichat/${order._id}`);
            if (!r.ok) return { id: order._id, count: 0 };
            const msgs = await r.json();
            // Unread = messages sent by 'client' that are not read
            const count = msgs.filter(m => m.sender === 'client' && !m.read).length;
            return { id: order._id, count };
          } catch {
            return { id: order._id, count: 0 };
          }
        })
      );
      const map = {};
      results.forEach(({ id, count }) => { map[id] = count; });
      setUnreadCounts(map);
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  };

  useEffect(() => {
    loadP();
    const interval = setInterval(loadP, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!orders.length) return;
    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, [orders.length]);

  // One clock for every countdown on the board.
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const renderAttachments = (attachments = []) => {
    const baseUrl = `${base_url}/uploads/`;
    return attachments.map((att, i) => {
      const rel = att.split("/uploads/")[1];
      const url = `${baseUrl}${encodeURIComponent(rel).replace(/%2F/g, "/")}`;
      const isImg = /\.(png|jpg|jpeg|svg|webp)$/i.test(att);
      const isPDF = /\.pdf$/i.test(att);
      return (
        <div key={i} className="inline-block mr-2 mb-1">
          {isImg ? (
            <a href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="" className="w-14 h-14 object-cover rounded border border-gray-200 hover:scale-105 transition-transform" />
            </a>
          ) : (
            <a href={url} target="_blank" rel="noreferrer"
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors">
              {isPDF ? "📄 PDF" : "📎 File"}
            </a>
          )}
        </div>
      );
    });
  };

  // Optimistic: the card moves at once and goes back if the server refuses.
  const handleStatusChange = async (orderId, newStatus) => {
    const order = ordersRef.current.find(o => o._id === orderId);
    if (!order || order.status === newStatus) return;

    if (newStatus === "rejected") {
      const { isConfirmed } = await Swal.fire({
        title: "Reject this project?",
        text: order.projectTitle || order.packageName,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Reject",
      });
      if (!isConfirmed) return;
    }

    const stamp = newStatus === "started" ? { startedAt: new Date().toISOString() } : newStatus === "completed" ? { completedAt: new Date().toISOString() } : {};
    setOrders(prev => prev.map(p => p._id === orderId ? { ...p, status: newStatus, ...stamp } : p));
    try {
      const res = await fetch(`${base_url}/orderstatus/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !(data.modifiedCount > 0 || data.acknowledged)) throw new Error(data.message || "Could not update status.");
    } catch (err) {
      setOrders(prev => prev.map(p => p._id === orderId ? order : p));
      Swal.fire({ icon: "error", title: "Failed!", text: err.message });
    }
  };

  const handlePStatusChange = (orderId, newStatus) => {
    fetch(`${base_url}/orderpaymentstatus/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pstatus: newStatus }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          Swal.fire({ icon: "success", title: "Payment Updated!", timer: 1200, showConfirmButton: false });
          setOrders(prev => prev.map(p => p._id === orderId ? { ...p, pstatus: newStatus } : p));
        }
      })
      .catch(() => Swal.fire({ icon: "error", title: "Failed!", text: "Could not update payment status." }));
  };

  const handleToggleContent = async (orderId, index) => {
    const order = ordersRef.current.find(o => o._id === orderId);
    if (!order) return;
    const packageContents = (order.packageContents || []).map((item, i) => i === index ? { ...item, isDone: !item.isDone } : item);
    setOrders(prev => prev.map(p => p._id === orderId ? { ...p, packageContents } : p));
    try {
      const res = await fetch(`${base_url}/updateordercontents/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageContents }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOrders(prev => prev.map(p => p._id === orderId ? order : p));
      Swal.fire({ icon: "error", title: "Failed!", text: "Could not update the checklist." });
    }
  };

  const handleChatClick = (orderId) => {
    if (!activeChatTasks.includes(orderId))
      setActiveChatTasks(prev => [...prev, orderId]);
    setChatVisibility(prev => ({ ...prev, [orderId]: true }));
    setUnreadCounts(prev => ({ ...prev, [orderId]: 0 }));
    fetch(`${base_url}/clichat/mark-read/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "client" }),
    }).catch(err => console.error("Error marking messages as read:", err));
  };

  const closeChat = (orderId) => {
    setActiveChatTasks(prev => prev.filter(id => id !== orderId));
    setChatVisibility(prev => { const u = { ...prev }; delete u[orderId]; return u; });
  };

  const toggleChatVisibility = (orderId) =>
    setChatVisibility(prev => ({ ...prev, [orderId]: !prev[orderId] }));

  // ── Drag & drop ──
  const handleDragEnd = () => { setDraggingId(null); setDragOverStatus(null); };
  const handleDrop = (e, status) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain") || draggingId;
    handleDragEnd();
    if (orderId) handleStatusChange(orderId, status);
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? orders.filter(o => [o.projectTitle, o.packageName, o.buyername, o._id].some(v => (v || "").toLowerCase().includes(q)))
    : orders;
  const openOrder = orders.find(o => o._id === openOrderId);

  return (
    <div className="w-full">
      <div className="hdr">Projects</div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search project, package, buyer, ID…"
            className="w-64 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <p className="text-sm text-gray-400">{orders.length} projects · drag a card to change its status</p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3 items-stretch" style={{ scrollbarWidth: "thin" }}>
          {columns.map(col => {
            const colOrders = filtered.filter(o => columnOf(o) === col.status);
            const over = dragOverStatus === col.status;
            return (
              <div
                key={col.status}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (!over) setDragOverStatus(col.status); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverStatus(null); }}
                onDrop={e => handleDrop(e, col.status)}
                className={`flex-1 min-w-[260px] flex flex-col rounded-xl p-2.5 border-2 transition-colors h-[calc(100vh-190px)] ${
                  over ? "bg-indigo-50 border-indigo-400" : "bg-slate-100 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 px-1 pb-2.5">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{col.title}</span>
                  <span className="text-xs text-slate-500 bg-slate-200 rounded-full px-2">{colOrders.length}</span>
                </div>

                <div className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto pr-0.5" style={{ scrollbarWidth: "thin" }}>
                  {colOrders.map(order => {
                    const pstatus = pstatusConfig[order.pstatus] || pstatusConfig.notpaid;
                    const unread = unreadCounts[order._id] || 0;
                    return (
                      <div
                        key={order._id}
                        draggable
                        onDragStart={e => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", order._id); setDraggingId(order._id); }}
                        onDragEnd={handleDragEnd}
                        onClick={() => setOpenOrderId(order._id)}
                        className={`bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition cursor-grab active:cursor-grabbing ${draggingId === order._id ? "opacity-40" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-gray-800 leading-snug break-words min-w-0">{order.projectTitle || order.packageName}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${pstatus.color}`}>{pstatus.label}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{order.packageName}</p>
                        {order.status === "cancelled" && (
                          <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.cancelled.color}`}>Cancelled</span>
                        )}

                        {order.status === "started" && order.startedAt && Number(order.time) > 0 && (
                          <div className="mt-2.5"><TimeLeft order={order} now={now} /></div>
                        )}
                        {order.status === "pending" && Number(order.time) > 0 && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-gray-500"><MdAccessTime size={13} /> {order.time} days delivery</p>
                        )}
                        {order.status === "completed" && order.completedAt && (
                          <p className="mt-2 text-xs text-green-600 font-medium">✅ Done {formatDate(order.completedAt)}</p>
                        )}

                        <div className="mt-2.5">
                          <Checklist order={order} onToggle={handleToggleContent} compact />
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {order.bdp && <img src={order.bdp} className="w-5 h-5 rounded-full object-cover border flex-shrink-0" alt="" />}
                            <span className="text-xs text-gray-500 truncate">{order.buyername || "Unknown"}</span>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); handleChatClick(order._id); }}
                            className="relative flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 bg-ink-100 text-ink-900 hover:bg-ink-200 rounded-lg transition-colors font-medium"
                          >
                            <MdChat className="w-3.5 h-3.5" /> Chat
                            {unread > 0 && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                {unread}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {colOrders.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">Drop projects here</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project details — opened by clicking a card */}
      {openOrder && createPortal(
        <div
          onClick={e => e.target === e.currentTarget && setOpenOrderId(null)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1050] p-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[760px] max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${(statusConfig[openOrder.status] || statusConfig.pending).color}`}>
                    {(statusConfig[openOrder.status] || statusConfig.pending).label}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">{openOrder._id}</span>
                </div>
                <h2 className="mt-1.5 text-lg font-semibold text-gray-800 break-words">{openOrder.projectTitle || openOrder.packageName}</h2>
                <p className="text-sm text-gray-500">{openOrder.packageName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { handleChatClick(openOrder._id); setOpenOrderId(null); }}
                  className="flex items-center gap-1.5 text-[13px] px-3 py-1.5 bg-ink-100 text-ink-900 hover:bg-ink-200 rounded-lg transition-colors font-medium"
                >
                  <MdChat className="w-4 h-4" /> Chat
                </button>
                <button onClick={() => setOpenOrderId(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                  <MdClose size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: "thin" }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Status</p>
                  <select
                    value={openOrder.status || "pending"}
                    onChange={e => handleStatusChange(openOrder._id, e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {columns.map(c => <option key={c.status} value={c.status}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Payment</p>
                  <select
                    value={openOrder.pstatus || "notpaid"}
                    onChange={e => handlePStatusChange(openOrder._id, e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="notpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Ordered</p>
                  <p className="text-sm text-gray-700">{formatDate(openOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Delivery</p>
                  <p className="text-sm text-gray-700">{openOrder.time ? `${openOrder.time} days` : "—"}</p>
                </div>
              </div>

              {openOrder.status === "started" && openOrder.startedAt && Number(openOrder.time) > 0 && (
                <TimeLeft order={openOrder} now={now} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Package Contents</p>
                  {(openOrder.packageContents || []).length
                    ? <Checklist order={openOrder} onToggle={handleToggleContent} />
                    : <span className="text-gray-400 text-sm">None</span>}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Buyer</p>
                    <div className="flex items-center gap-3">
                      {openOrder.bdp && <img src={openOrder.bdp} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow" alt="" />}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800">{openOrder.buyername || "—"}</p>
                        <p className="text-xs text-gray-400 break-all">{openOrder.email}</p>
                        <p className="text-xs text-gray-300 font-mono">{openOrder.buyerid}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Attachments</p>
                    <div className="flex flex-wrap gap-1">
                      {openOrder.attachments?.length ? renderAttachments(openOrder.attachments) : <span className="text-gray-400 text-xs">None</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Project Brief</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">{openOrder.projectBrief || "No details provided."}</p>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      <div className="flex flex-row-reverse items-end fixed right-4 bottom-4 gap-3 z-50">
        {activeChatTasks.map(orderId => {
          const task = orders.find(o => o._id === orderId);
          return (
            <AdminChat
              key={orderId}
              orderId={orderId}
              bdp={task?.bdp}
              buyerid={task?.buyerid}
              projectTitle={task?.projectTitle || 'Unknown'}
              buyerName={task?.buyername || 'Unknown'}
              projectDetails={task?.projectBrief || 'Unknown'}
              packageContents={task?.packageContents || []}
              isVisible={chatVisibility[orderId]}
              packageType="regular"
              onClose={() => closeChat(orderId)}
              onToggle={() => toggleChatVisibility(orderId)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Projects;
