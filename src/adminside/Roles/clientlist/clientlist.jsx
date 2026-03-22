import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { base_url } from "../../../config/config";

const lbl = {
  display: "block", fontSize: 11, color: "#94a3b8",
  marginBottom: 4, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase",
};
const inp = {
  width: "100%", border: "1px solid #e2e5ee", borderRadius: 9,
  padding: "9px 13px", fontSize: 13.5, fontFamily: "inherit",
  background: "#fafbfd", outline: "none", boxSizing: "border-box", color: "#1e293b",
};
const inpFocus = {
  ...inp, borderColor: "#6366f1", boxShadow: "0 0 0 3px rgba(99,102,241,.12)", background: "#fff",
};

const atypeBadge = {
  free:       { bg: "#f0fdf4", color: "#16a34a" },
  premium:    { bg: "#eff6ff", color: "#2563eb" },
  enterprise: { bg: "#faf5ff", color: "#9333ea" },
};

// online = last active within 3 minutes
const isOnline = (lastActive) => {
  if (!lastActive) return false;
  return (Date.now() - new Date(lastActive).getTime()) < 3 * 60 * 1000;
};

const Clientlist = () => {
  const [clients, setClients]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showEdit, setShowEdit]       = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [focused, setFocused]         = useState(null);
  const [search, setSearch]           = useState("");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [now, setNow] = useState(Date.now()); // ticks every 30s to re-evaluate online status
  const [formData, setFormData]       = useState({
    rname: "", remail: "", rphone: "", country: "", atype: "",
  });

  useEffect(() => {
    fetch(`${base_url}/allclients`)
      .then(r => r.json())
      .then(data => { setClients(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  // ── tick every 30s so online/offline badges self-update ──
  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(ticker);
  }, []);

  const handleDelete = (_id) => {
    Swal.fire({
      title: "Delete this client?", text: "This cannot be undone.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", confirmButtonText: "Delete",
    }).then(({ isConfirmed }) => {
      if (!isConfirmed) return;
      fetch(`${base_url}/delclient/${_id}`, { method: "DELETE" })
        .then(r => r.json())
        .then(data => {
          if (data.deletedCount > 0) {
            Swal.fire("Deleted!", "Client removed.", "success");
            setClients(prev => prev.filter(c => c._id !== _id));
          }
        })
        .catch(console.error);
    });
  };

  const handleEditClick = (client) => {
    setEditingClient(client);
    setFormData({
      rname: client.rname || "", remail: client.remail || "",
      rphone: client.rphone || "", country: client.country || "", atype: client.atype || "",
    });
    setShowEdit(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const res  = await fetch(`${base_url}/updateclient/${editingClient._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.modifiedCount > 0) {
        Swal.fire("Updated!", "Client info updated.", "success");
        setClients(prev => prev.map(c => c._id === editingClient._id ? { ...c, ...formData } : c));
        setShowEdit(false);
      } else {
        Swal.fire("No changes", "", "info");
      }
    } catch { Swal.fire("Error", "Failed to update.", "error"); }
  };

  const filtered = clients.filter(c =>
    (c.rname  || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.remail || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.country|| "").toLowerCase().includes(search.toLowerCase())
  );

  const fi = (name) => focused === name ? inpFocus : inp;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700&display=swap');
        .cl-wrap   { font-family:'DM Sans',sans-serif; background:#f7f8fb; min-height:100vh; }
        .cl-syne   { font-family:'Syne',sans-serif; }
        .cl-card   { background:#fff; border:1px solid #e8eaf0; border-radius:16px; overflow:hidden; }
        .cl-row    { border-bottom:1px solid #f0f2f7; transition:background .15s; }
        .cl-row:hover { background:#fafbfd; }
        .cl-row:last-child { border-bottom:none; }
        .cl-avatar {
          width:42px; height:42px; border-radius:50%;
          object-fit:cover; border:2px solid #e8eaf0; flex-shrink:0;
        }
        .cl-search {
          border:1px solid #e2e5ee; border-radius:9px; padding:8px 14px;
          font-size:13px; font-family:'DM Sans',sans-serif;
          background:#fafbfd; outline:none; width:240px; color:#1e293b;
          transition:border-color .2s, box-shadow .2s;
        }
        .cl-search:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); background:#fff; }
        .cl-editbtn {
          padding:5px 14px; border-radius:7px; border:none;
          background:#eff6ff; color:#2563eb; font-weight:500;
          font-size:12px; cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:background .15s; margin-right:6px;
        }
        .cl-editbtn:hover { background:#dbeafe; }
        .cl-delbtn {
          padding:5px 14px; border-radius:7px; border:none;
          background:#fef2f2; color:#ef4444; font-weight:500;
          font-size:12px; cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:background .15s;
        }
        .cl-delbtn:hover { background:#fee2e2; }
        @keyframes cl-drop { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }
        .cl-order-pill {
          display:inline-block; background:#f8fafc; border:1px solid #e8eaf0;
          border-radius:8px; padding:4px 10px; font-size:12px; color:#475569;
          margin:2px 0;
        }
      `}</style>

      <div className="cl-wrap w-full">

        {/* kept as-is per instructions */}
        <div className="hdr">Client List</div>

        <div style={{ padding:"20px 28px 28px" }}>

          {/* toolbar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <input
                className="cl-search"
                placeholder="Search name, email, country…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize:12, color:"#94a3b8", background:"#f1f5f9", borderRadius:999, padding:"4px 14px", fontWeight:500 }}>
              {filtered.length} {filtered.length === 1 ? "client" : "clients"}
            </span>
          </div>

          {/* table card */}
          <div className="cl-card">
            {loading ? (
              <div style={{ padding:"56px 0", textAlign:"center", color:"#94a3b8", fontSize:14 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:"56px 0", textAlign:"center", color:"#94a3b8", fontSize:14 }}>No clients found.</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #f0f2f7" }}>
                    {["Client","Contact","Details","Status","Orders",""].map(h => (
                      <th key={h} style={{ textAlign:"left", padding:"12px 20px", fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:"0.07em", textTransform:"uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(client => {
                    const badge = atypeBadge[client.atype] || { bg:"#f1f5f9", color:"#64748b" };
                    return (
                      <tr key={client._id} className="cl-row">

                        {/* avatar + name */}
                        <td style={{ padding:"14px 20px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                            <img
                              src={client.rppic || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                              alt={client.rname}
                              className="cl-avatar"
                            />
                            <div>
                              <p style={{ margin:0, fontWeight:600, color:"#1e293b", fontSize:13.5 }}>{client.rname}</p>
                              <p style={{ margin:0, fontSize:11, color:"#94a3b8", marginTop:1 }}>ID: {client._id?.slice(-6)}</p>
                            </div>
                          </div>
                        </td>

                        {/* contact */}
                        <td style={{ padding:"14px 20px" }}>
                          <p style={{ margin:0, fontSize:13, color:"#334155" }}>{client.remail || "—"}</p>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#94a3b8" }}>{client.rphone || "—"}</p>
                        </td>

                        {/* details */}
                        <td style={{ padding:"14px 20px" }}>
                          <p style={{ margin:0, fontSize:13, color:"#475569" }}>{client.country || "—"}</p>
                          {client.atype && (
                            <span style={{
                              display:"inline-block", marginTop:5, fontSize:11.5, fontWeight:600,
                              padding:"2px 10px", borderRadius:999,
                              background: badge.bg, color: badge.color,
                            }}>
                              {client.atype.charAt(0).toUpperCase() + client.atype.slice(1)}
                            </span>
                          )}
                        </td>

                        {/* status */}
                        <td style={{ padding:"14px 20px" }}>
                          {(() => {
                            const online = isOnline(client.lastActive);
                            return (
                              <div>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                                  <span style={{
                                    width:8, height:8, borderRadius:"50%", flexShrink:0,
                                    background: online ? "#22c55e" : "#d1d5db",
                                    boxShadow: online ? "0 0 0 3px rgba(34,197,94,.2)" : "none",
                                  }} />
                                  <span style={{
                                    fontSize:12, fontWeight:600,
                                    color: online ? "#16a34a" : "#9ca3af",
                                  }}>
                                    {online ? "Online" : "Offline"}
                                  </span>
                                </div>
                                <p style={{ margin:0, fontSize:11, color:"#94a3b8" }}>
                                  {client.lastActive
                                    ? (() => {
                                        const diff = Math.floor((Date.now() - new Date(client.lastActive).getTime()) / 1000);
                                        if (diff < 60)  return `${diff}s ago`;
                                        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
                                        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
                                        return new Date(client.lastActive).toLocaleDateString();
                                      })()
                                    : "Never"
                                  }
                                </p>
                              </div>
                            );
                          })()}
                        </td>

                        {/* orders — expandable */}
                        <td style={{ padding:"14px 20px" }}>
                          {client.orders && client.orders.length > 0 ? (() => {
                            const isOpen = !!expandedOrders[client._id];
                            return (
                              <div>
                                <button
                                  onClick={() => setExpandedOrders(prev => ({ ...prev, [client._id]: !prev[client._id] }))}
                                  style={{
                                    display:"flex", alignItems:"center", gap:6,
                                    background:"#f1f5f9", border:"none", borderRadius:8,
                                    padding:"5px 12px", cursor:"pointer", fontSize:12,
                                    fontWeight:600, color:"#475569", fontFamily:"inherit",
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background="#e2e8f0"}
                                  onMouseLeave={e => e.currentTarget.style.background="#f1f5f9"}
                                >
                                  <span style={{
                                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                                    width:18, height:18, borderRadius:"50%",
                                    background:"#1e293b", color:"#fff", fontSize:10, fontWeight:700,
                                  }}>
                                    {client.orders.length}
                                  </span>
                                  {isOpen ? "Hide" : "View Orders"}
                                  <span style={{
                                    fontSize:10, display:"inline-block",
                                    transition:"transform .2s",
                                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                  }}>▼</span>
                                </button>
                                {isOpen && (
                                  <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                                    {client.orders.map((order, idx) => (
                                      <div key={idx} style={{
                                        background:"#f8fafc", border:"1px solid #e8eaf0",
                                        borderRadius:10, padding:"8px 12px", fontSize:12.5,
                                      }}>
                                        <p style={{ margin:"0 0 3px", fontWeight:600, color:"#1e293b" }}>
                                          {order.projectTitle || "Untitled"}
                                        </p>
                                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                                          <span style={{ color:"#16a34a", fontWeight:700 }}>${order.sellPrice}</span>
                                          {order.status && (
                                            <span style={{
                                              fontSize:11, fontWeight:600, padding:"1px 8px",
                                              borderRadius:999, background:"#eff6ff", color:"#2563eb",
                                            }}>
                                              {order.status}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })() : (
                            <span style={{ fontSize:12, color:"#cbd5e1", fontStyle:"italic" }}>No orders</span>
                          )}
                        </td>

                        {/* actions */}
                        <td style={{ padding:"14px 20px", whiteSpace:"nowrap" }}>
                          <button className="cl-editbtn" onClick={() => handleEditClick(client)}>Edit</button>
                          <button className="cl-delbtn"  onClick={() => handleDelete(client._id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Modal via Portal ── */}
      {showEdit && createPortal(
        <div
          onClick={e => e.target === e.currentTarget && setShowEdit(false)}
          style={{
            position:"fixed", top:0, left:0, right:0, bottom:0,
            background:"rgba(15,23,42,.5)", backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:99999,
          }}
        >
          <div style={{
            background:"#fff", borderRadius:18, padding:32,
            width:"calc(100% - 32px)", maxWidth:520,
            boxShadow:"0 24px 60px rgba(0,0,0,.2)",
            fontFamily:"'DM Sans',sans-serif",
          }}>
            {/* modal header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <h2 className="cl-syne" style={{ margin:0, fontSize:18, fontWeight:700, color:"#1e293b" }}>
                Edit Client
              </h2>
              <button onClick={() => setShowEdit(false)}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#94a3b8", padding:0, lineHeight:1 }}>✕</button>
            </div>

            <form onSubmit={handleUpdate}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={lbl}>Full Name</label>
                  <input name="rname" required value={formData.rname} onChange={handleInputChange}
                    style={fi("rname")} onFocus={() => setFocused("rname")} onBlur={() => setFocused(null)} />
                </div>
                <div>
                  <label style={lbl}>Email Address</label>
                  <input name="remail" type="email" required value={formData.remail} onChange={handleInputChange}
                    style={fi("remail")} onFocus={() => setFocused("remail")} onBlur={() => setFocused(null)} />
                </div>
                <div>
                  <label style={lbl}>Phone Number</label>
                  <input name="rphone" value={formData.rphone} onChange={handleInputChange}
                    style={fi("rphone")} onFocus={() => setFocused("rphone")} onBlur={() => setFocused(null)} />
                </div>
                <div>
                  <label style={lbl}>Country</label>
                  <input name="country" value={formData.country} onChange={handleInputChange}
                    style={fi("country")} onFocus={() => setFocused("country")} onBlur={() => setFocused(null)} />
                </div>
                <div style={{ gridColumn:"1 / -1" }}>
                  <label style={lbl}>Account Type</label>
                  <select name="atype" value={formData.atype} onChange={handleInputChange}
                    style={fi("atype")} onFocus={() => setFocused("atype")} onBlur={() => setFocused(null)}>
                    <option value="">Select Type</option>
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <button type="button" onClick={() => setShowEdit(false)}
                  style={{ flex:1, padding:"10px 0", borderRadius:9, border:"none", background:"#f1f3f8", color:"#475569", fontWeight:500, cursor:"pointer", fontSize:13 }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex:2, padding:"10px 0", borderRadius:9, border:"none", background:"#1e293b", color:"#fff", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </>
  );
};

export default Clientlist;