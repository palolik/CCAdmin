import { useState, useEffect, useRef } from "react";
import { useLoaderData } from "react-router-dom";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import { MdChat } from "react-icons/md";
import AdminChat from './AdminChat';
import Swal from 'sweetalert2';
import { base_url } from "../../config/config";

const ORDERS_PER_PAGE = 10;

const statusConfig = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-700 border-amber-200" },
  started:   { label: "Active",    color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
  rejected:  { label: "Rejected",  color: "bg-red-100 text-red-700 border-red-200" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

const pstatusConfig = {
  notpaid: { label: "Unpaid", color: "bg-rose-100 text-rose-700 border-rose-200" },
  paid:    { label: "Paid",   color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });
};

const Projects = () => {
  const loaderorders = useLoaderData();

  const [orders, setOrders] = useState(
    [...(loaderorders || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );
  const [remainingTimes, setRemainingTimes] = useState({});
  const [chatVisibility, setChatVisibility] = useState({});
  const [activeChatTasks, setActiveChatTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  // ✅ separate map for unread counts so they update independently
  const [unreadCounts, setUnreadCounts] = useState({});

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
      const allOrders = ordersRef.current;
      // Fetch unread count per order in parallel
      const results = await Promise.all(
        allOrders.map(async (order) => {
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

  // ✅ Load unread counts once orders are loaded, then poll every 5s
  useEffect(() => {
    if (!orders.length) return;
    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, [orders.length]);

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const times = {};
      ordersRef.current.forEach(order => {
        if (order.status === "completed" || !order.startedAt || !order.time) return;
        const startedAt = new Date(order.startedAt);
        const target = new Date(startedAt.getTime() + order.time * 86400000);
        const diff = target - now;
        if (diff > 0) {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          times[order._id] = `${h}h ${m}m ${s}s`;
        } else {
          times[order._id] = "Time's up!";
        }
      });
      setRemainingTimes(times);
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, []);

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const paginated = orders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  const renderAttachments = (attachments = []) => {
    const baseUrl = `${base_url}/uploads/`;
    return attachments.map((att, i) => {
      const rel = att.split("/uploads/")[1];
      const url = `${baseUrl}${encodeURIComponent(rel).replace(/%2F/g, "/")}`;
      const isImg = /\.(png|jpg|jpeg|svg)$/i.test(att);
      const isPDF = /\.pdf$/i.test(att);
      return (
        <div key={i} className="inline-block mr-2 mb-1">
          {isImg ? (
            <a href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="" className="w-12 h-12 object-cover rounded border border-gray-200 hover:scale-105 transition-transform" />
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

  const calculateProgress = (contents = []) => {
    if (!contents.length) return 0;
    return Math.round((contents.filter(c => c.isDone).length / contents.length) * 100);
  };

  const handleStatusChange = (orderId, newStatus) => {
    fetch(`${base_url}/orderstatus/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.modifiedCount > 0 || data.acknowledged) {
          Swal.fire({ icon: "success", title: "Status Updated!", text: `Changed to ${newStatus}`, timer: 1200, showConfirmButton: false });
          setOrders(prev => prev.map(p => p._id === orderId ? { ...p, status: newStatus } : p));
        }
      })
      .catch(() => Swal.fire({ icon: "error", title: "Failed!", text: "Could not update status." }));
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

  const handleChatClick = (orderId) => {
    if (!activeChatTasks.includes(orderId))
      setActiveChatTasks(prev => [...prev, orderId]);
    setChatVisibility(prev => ({ ...prev, [orderId]: true }));

    // ✅ Clear unread count immediately in UI
    setUnreadCounts(prev => ({ ...prev, [orderId]: 0 }));

    // ✅ Fixed: correct endpoint + sender body (backend requires sender field)
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

  return (
    <div className="w-full">
      <div className="hdr">Projects</div>

      <div className="p-3 space-y-3">
        {paginated.map((order, index) => {
          const progress = calculateProgress(order.packageContents);
          const status = statusConfig[order.status] || statusConfig.pending;
          const pstatus = pstatusConfig[order.pstatus] || pstatusConfig.notpaid;
          const isExpanded = expandedRow === order._id;
          const globalIndex = (currentPage - 1) * ORDERS_PER_PAGE + index + 1;
          const unread = unreadCounts[order._id] || 0; // ✅ read from separate map

          return (
            <div key={order._id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">

              {/* Row summary */}
              <div
                className="grid grid-cols-[80px_100px_180px_120px_140px_160px_120px_160px] gap-4 px-5 py-4 items-center cursor-pointer"
                onClick={() => setExpandedRow(isExpanded ? null : order._id)}
              >
                <span className="text-xs text-gray-400 font-mono">{globalIndex}</span>

                <div className="w-32">
                  <p className="font-semibold text-gray-800 text-sm truncate">{order.projectTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {order.bdp && <img src={order.bdp} className="w-5 h-5 rounded-full object-cover border" alt="" />}
                    <span className="text-xs text-gray-400 truncate">{order.buyername || "Unknown"}</span>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600 truncate">{order.packageName}</p>
                  <p className="text-xs text-gray-400">{order.packageContents?.length || 0} items</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs">
                  {order.status === "completed" ? (
                    <div>
                      <p className="text-green-600 font-medium">✅ Done</p>
                      <p className="text-gray-400">{formatDate(order.completedAt)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-400">{formatDate(order.startedAt)}</p>
                      <p className="text-blue-500 font-mono">{remainingTimes[order._id] || "—"}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-row gap-1">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border w-fit ${status.color}`}>
                    {status.label}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border w-fit ${pstatus.color}`}>
                    {pstatus.label}
                  </span>
                </div>

                <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>

                <div className="flex flex-row gap-2" onClick={e => e.stopPropagation()}>
                  <select
                    value={order.status || "pending"}
                    onChange={e => handleStatusChange(order._id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="pending">Pending</option>
                    <option value="started">Active</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select
                    value={order.pstatus || "notpaid"}
                    onChange={e => handlePStatusChange(order._id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="notpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>

                  {/* ✅ Fixed: relative on button so absolute badge positions correctly */}
                  <button
                    onClick={() => handleChatClick(order._id)}
                    className="relative flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
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

              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Project Brief</p>
                    <p className="text-gray-600 leading-relaxed">{order.projectBrief || "No details provided."}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Package Contents</p>
                    <ul className="space-y-1.5">
                      {(order.packageContents || []).map((c, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <IoCheckmarkDoneOutline className={`w-4 h-4 ${c.isDone ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className={c.isDone ? "text-gray-700" : "text-gray-400"}>{c.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Buyer</p>
                      <div className="flex items-center gap-3">
                        {order.bdp && <img src={order.bdp} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow" alt="" />}
                        <div>
                          <p className="font-medium text-gray-800">{order.buyername || "—"}</p>
                          <p className="text-xs text-gray-400">{order.email}</p>
                          <p className="text-xs text-gray-300 font-mono">{order.buyerid}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Attachments</p>
                      <div className="flex flex-wrap gap-1">
                        {order.attachments?.length ? renderAttachments(order.attachments) : <span className="text-gray-400 text-xs">None</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
          <p className="text-sm text-gray-400">
            Showing {(currentPage - 1) * ORDERS_PER_PAGE + 1}–{Math.min(currentPage * ORDERS_PER_PAGE, orders.length)} of {orders.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >← Prev</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-9 h-9 text-sm rounded-lg border transition-colors font-medium ${
                      currentPage === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >{p}</button>
                )
              )}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Next →</button>
          </div>
        </div>
      )}

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