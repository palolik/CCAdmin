import { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { base_url } from "../../../config/config";

// ── shared inline styles ──────────────────────────────────────────────────────
const lbl = {
  display: "block", fontSize: 11, color: "#94a3b8",
  marginBottom: 4, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase",
};
const inp = {
  width: "100%", border: "1px solid #e2e5ee", borderRadius: 9,
  padding: "9px 13px", fontSize: 13.5, fontFamily: "inherit",
  background: "#fafbfd", outline: "none", boxSizing: "border-box", color: "#1e293b",
  transition: "border-color .2s, box-shadow .2s",
};
const inpFocus = {
  ...inp, borderColor: "#6366f1", boxShadow: "0 0 0 3px rgba(99,102,241,.12)", background: "#fff",
};

const departmentData = [
  { department: "Web development", subDepartments: ["frontend", "backend"] },
  { department: "Graphic design", subDepartments: ["social media design", "post design", "logo design"] },
];
const subdepartmentData = {
  frontend: ["react", "angular"],
  backend: ["laravel", "php", "python"],
  "social media design": ["dp", "cover"],
  "post design": ["banner", "post creation"],
  "logo design": ["logo creation", "branding"],
};

const depColor = {
  "Web development": { bg: "#eff6ff", color: "#2563eb" },
  "Graphic design":  { bg: "#fdf4ff", color: "#9333ea" },
};


const isOnline = (lastActive) => {
  if (!lastActive) return false;
  return (Date.now() - new Date(lastActive).getTime()) < 3 * 60 * 1000;
};

const relativeTime = (lastActive) => {
  if (!lastActive) return "Never";
  const diff = Math.floor((Date.now() - new Date(lastActive).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(lastActive).toLocaleDateString();
};

// ─────────────────────────────────────────────────────────────────────────────
const Employeelist = () => {
  const loaderEmployee = useLoaderData();
  const [employees, setEmployees]               = useState(loaderEmployee || []);
  const [selectedDepartment, setSelectedDepartment]       = useState("");
  const [selectedSubDepartment, setSelectedSubDepartment] = useState("");
  const [selectedExpertise, setSelectedExpertise]         = useState("");
  const [availableExpertise, setAvailableExpertise]       = useState([]);
  const [showForm, setShowForm]                 = useState(false);
  const [focused, setFocused]                   = useState(null);
  const [search, setSearch]                     = useState("");
  const [filterDep, setFilterDep]               = useState("All");
  const [now, setNow]                           = useState(Date.now());

  useEffect(() => {
    fetch(`${base_url}/employees`)
      .then(r => r.json())
      .then(data => setEmployees(data))
      .catch(console.error);
  }, []);

  // tick every 30s to re-evaluate online badges
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setSelectedSubDepartment("");
    setAvailableExpertise([]);
  }, [selectedDepartment]);

  useEffect(() => {
    setAvailableExpertise(subdepartmentData[selectedSubDepartment] || []);
    setSelectedExpertise("");
  }, [selectedSubDepartment]);

  const fi = (name) => focused === name ? inpFocus : inp;

  const handleAddPost = async (event) => {
    event.preventDefault();
    const form = event.target;
    const postData = {
      rppic:  form.rppic.value.trim(),
      role:   "emp",
      rname:  form.rname.value.trim(),
      remail: form.remail.value.trim(),
      rphone: form.rphone.value.trim(),
      rpass:  form.rpass.value.trim(),
      rdep:   selectedDepartment,
      rsubdep: selectedSubDepartment,
      esprts: selectedExpertise,
      bkash:  form.bkash.value.trim(),
      nogod:  form.nogod.value.trim(),
      bankn:  form.bankn.value.trim(),
      bacc:   form.bacc.value.trim(),
      atime: 0, ecc: 0, xp: 0,
    };
    try {
      const res  = await fetch(`${base_url}/addemployee`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      const data = await res.json();
      if (data.insertedId) {
        Swal.fire("Success", "New Employee Added!", "success");
        setEmployees(prev => [{ ...postData, _id: data.insertedId }, ...prev]);
        form.reset();
        setSelectedDepartment(""); setSelectedSubDepartment(""); setSelectedExpertise("");
        setShowForm(false);
      } else {
        Swal.fire("Error", "Could not add employee", "error");
      }
    } catch {
      Swal.fire("Error", "An unexpected error occurred", "error");
    }
  };

  const handleDelete = (_id) => {
    Swal.fire({
      title: "Delete this employee?", text: "This cannot be undone.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", confirmButtonText: "Delete",
    }).then(({ isConfirmed }) => {
      if (!isConfirmed) return;
      fetch(`${base_url}/delemployee/${_id}`, { method: "DELETE" })
        .then(r => r.json())
        .then(data => {
          if (data.deletedCount > 0) {
            Swal.fire("Deleted!", "Employee removed.", "success");
            setEmployees(prev => prev.filter(m => m._id !== _id));
          }
        })
        .catch(console.error);
    });
  };

  const allDeps = ["All", ...departmentData.map(d => d.department)];

  const filtered = employees.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = (m.rname || "").toLowerCase().includes(q) ||
                        (m.remail || "").toLowerCase().includes(q) ||
                        (m.rdep || "").toLowerCase().includes(q);
    const matchDep = filterDep === "All" || m.rdep === filterDep;
    return matchSearch && matchDep;
  });

  const onlineCount  = employees.filter(m => isOnline(m.lastActive)).length;
  const offlineCount = employees.length - onlineCount;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700&display=swap');
        .el-wrap  { font-family:'DM Sans',sans-serif; background:#f7f8fb; min-height:100vh; }
        .el-syne  { font-family:'Syne',sans-serif; }
        .el-card  { background:#fff; border:1px solid #e8eaf0; border-radius:16px; overflow:hidden; }
        .el-stat  { background:#fff; border:1px solid #e8eaf0; border-radius:14px; padding:16px 20px; }
        .el-row   { border-bottom:1px solid #f0f2f7; transition:background .15s; }
        .el-row:hover { background:#fafbfd; }
        .el-row:last-child { border-bottom:none; }
        .el-avatar { width:44px; height:44px; border-radius:12px; object-fit:cover; border:1.5px solid #e8eaf0; flex-shrink:0; }
        .el-search {
          border:1px solid #e2e5ee; border-radius:9px; padding:8px 14px;
          font-size:13px; font-family:'DM Sans',sans-serif;
          background:#fafbfd; outline:none; width:220px; color:#1e293b;
          transition:border-color .2s, box-shadow .2s;
        }
        .el-search:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); background:#fff; }
        .el-chip {
          padding:5px 14px; border-radius:999px; font-size:12.5px; font-weight:500;
          border:1.5px solid #e2e5ee; background:#fff; color:#64748b;
          cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif;
        }
        .el-chip:hover,.el-chip.on { border-color:#1e293b; background:#1e293b; color:#fff; }
        .el-addbtn {
          padding:9px 20px; border-radius:9px; border:none;
          background:#1e293b; color:#fff; font-weight:600; font-size:13px;
          font-family:'DM Sans',sans-serif; cursor:pointer; transition:background .2s;
        }
        .el-addbtn:hover { background:#334155; }
        .el-delbtn {
          padding:5px 14px; border-radius:7px; border:none;
          background:#fef2f2; color:#ef4444; font-weight:500;
          font-size:12px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background .15s;
        }
        .el-delbtn:hover { background:#fee2e2; }
        @keyframes el-up { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
      `}</style>

      <div className="el-wrap w-full">
        <div className="hdr">Employee List</div>

        <div style={{ padding:"20px 28px 28px" }}>

          {/* ── Stats ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
            {[
              { label:"Total Employees", value: employees.length,  color:"#1e293b" },
              { label:"Online Now",      value: onlineCount,       color:"#16a34a" },
              { label:"Offline",         value: offlineCount,      color:"#94a3b8" },
              { label:"Departments",     value: departmentData.length, color:"#2563eb" },
            ].map(s => (
              <div key={s.label} className="el-stat">
                <p style={{ margin:0, fontSize:11, color:"#94a3b8", fontWeight:500, marginBottom:4 }}>{s.label}</p>
                <p className="el-syne" style={{ margin:0, fontSize:22, fontWeight:700, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <input className="el-search" placeholder="Search name, email, dept…" value={search} onChange={e => setSearch(e.target.value)} />
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {allDeps.map(d => (
                  <button key={d} className={`el-chip ${filterDep===d?"on":""}`} onClick={() => setFilterDep(d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#94a3b8", background:"#f1f5f9", borderRadius:999, padding:"4px 14px", fontWeight:500 }}>
                {filtered.length} employees
              </span>
              <button className="el-addbtn" onClick={() => setShowForm(true)}>+ Add Employee</button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="el-card">
            {filtered.length === 0 ? (
              <div style={{ padding:"56px 0", textAlign:"center", color:"#94a3b8", fontSize:14 }}>No employees found.</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #f0f2f7" }}>
                    {["Employee","Contact","Department","Banking","Stats","Status",""].map(h => (
                      <th key={h} style={{ textAlign:"left", padding:"12px 18px", fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:"0.07em", textTransform:"uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(member => {
                    const online = isOnline(member.lastActive);
                    const dc     = depColor[member.rdep] || { bg:"#f1f5f9", color:"#64748b" };
                    return (
                      <tr key={member._id} className="el-row">

                        {/* employee */}
                        <td style={{ padding:"14px 18px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ position:"relative" }}>
                              <img src={member.rppic || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                                alt={member.rname} className="el-avatar"
                                onError={e => { e.target.src="https://cdn-icons-png.flaticon.com/512/847/847969.png"; }} />
                              <span style={{
                                position:"absolute", bottom:0, right:0,
                                width:10, height:10, borderRadius:"50%",
                                background: online ? "#22c55e" : "#d1d5db",
                                border:"2px solid #fff",
                              }} />
                            </div>
                            <div>
                              <p style={{ margin:0, fontWeight:600, color:"#1e293b", fontSize:13.5 }}>{member.rname}</p>
                              <p style={{ margin:0, fontSize:11, color:"#94a3b8", marginTop:1 }}>ID: {member._id?.slice(-6)}</p>
                            </div>
                          </div>
                        </td>

                        {/* contact */}
                        <td style={{ padding:"14px 18px" }}>
                          <p style={{ margin:0, fontSize:13, color:"#334155" }}>{member.remail}</p>
                          <p style={{ margin:"3px 0 0", fontSize:12, color:"#94a3b8" }}>{member.rphone}</p>
                          <p style={{ margin:"3px 0 0", fontSize:11, color:"#cbd5e1" }}>{member.rpass}</p>
                        </td>

                        {/* department */}
                        <td style={{ padding:"14px 18px" }}>
                          <span style={{ display:"inline-block", fontSize:11.5, fontWeight:600, padding:"2px 10px", borderRadius:999, background: dc.bg, color: dc.color, marginBottom:4 }}>
                            {member.rdep || "—"}
                          </span>
                          <p style={{ margin:0, fontSize:12, color:"#64748b" }}>{member.rsubdep || "—"}</p>
                          <p style={{ margin:"2px 0 0", fontSize:11, color:"#94a3b8" }}>{member.esprts || "—"}</p>
                        </td>

                        {/* banking */}
                        <td style={{ padding:"14px 18px" }}>
                          {[["Bkash", member.bkash], ["Nagad", member.nogod], ["Bank", member.bankn], ["A/C", member.bacc]].map(([label, val]) => (
                            val ? (
                              <p key={label} style={{ margin:"0 0 2px", fontSize:12, color:"#475569" }}>
                                <span style={{ color:"#94a3b8", fontWeight:500 }}>{label}: </span>{val}
                              </p>
                            ) : null
                          ))}
                        </td>

                        {/* stats */}
                        <td style={{ padding:"14px 18px" }}>
                          {[["Active Time", member.atime], ["Earned CC", member.ecc], ["XP", member.xp]].map(([label, val]) => (
                            <p key={label} style={{ margin:"0 0 3px", fontSize:12, color:"#475569" }}>
                              <span style={{ color:"#94a3b8" }}>{label}: </span>
                              <span style={{ fontWeight:600, color:"#1e293b" }}>{val ?? 0}</span>
                            </p>
                          ))}
                        </td>

                        {/* status */}
                        <td style={{ padding:"14px 18px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                            <span style={{
                              width:8, height:8, borderRadius:"50%", flexShrink:0,
                              background: online ? "#22c55e" : "#d1d5db",
                              boxShadow: online ? "0 0 0 3px rgba(34,197,94,.2)" : "none",
                            }} />
                            <span style={{ fontSize:12, fontWeight:600, color: online ? "#16a34a" : "#9ca3af" }}>
                              {online ? "Online" : "Offline"}
                            </span>
                          </div>
                          <p style={{ margin:0, fontSize:11, color:"#94a3b8" }}>{relativeTime(member.lastActive)}</p>
                        </td>

                        {/* actions */}
                        <td style={{ padding:"14px 18px" }}>
                          <button className="el-delbtn" onClick={() => handleDelete(member._id)}>Delete</button>
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

      {/* ── Add Employee Modal ── */}
      {showForm && createPortal(
        <div
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
          style={{
            position:"fixed", top:0, left:0, right:0, bottom:0,
            background:"rgba(15,23,42,.55)", backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:99999, padding:16,
          }}
        >
          <div style={{
            background:"#fff", borderRadius:18, padding:32,
            width:"100%", maxWidth:640,
            maxHeight:"90vh", overflowY:"auto",
            boxShadow:"0 24px 60px rgba(0,0,0,.22)",
            fontFamily:"'DM Sans',sans-serif",
            animation:"el-up .2s ease",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <h2 className="el-syne" style={{ margin:0, fontSize:18, fontWeight:700, color:"#1e293b" }}>Add New Employee</h2>
              <button onClick={() => setShowForm(false)}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#94a3b8", padding:0, lineHeight:1 }}>✕</button>
            </div>

            <form onSubmit={handleAddPost}>
              {/* Personal info grid */}
              <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:"0.07em", textTransform:"uppercase" }}>Personal Info</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                {[
                  { label:"Profile Picture URL", name:"rppic" },
                  { label:"Full Name",            name:"rname" },
                  { label:"Email",                name:"remail", type:"email" },
                  { label:"Phone",                name:"rphone" },
                  { label:"Password",             name:"rpass", type:"password" },
                ].map(({ label, name, type="text" }) => (
                  <div key={name}>
                    <label style={lbl}>{label}</label>
                    <input name={name} type={type} required style={fi(name)}
                      onFocus={() => setFocused(name)} onBlur={() => setFocused(null)} placeholder="—" />
                  </div>
                ))}
              </div>

              {/* Department */}
              <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:"0.07em", textTransform:"uppercase" }}>Department</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:18 }}>
                <div>
                  <label style={lbl}>Department</label>
                  <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} required style={inp}>
                    <option value="">Select</option>
                    {departmentData.map(d => <option key={d.department}>{d.department}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Sub Department</label>
                  <select value={selectedSubDepartment} onChange={e => setSelectedSubDepartment(e.target.value)}
                    disabled={!selectedDepartment} required style={{ ...inp, opacity: selectedDepartment ? 1 : 0.5 }}>
                    <option value="">Select</option>
                    {departmentData.find(d => d.department === selectedDepartment)?.subDepartments.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Expertise</label>
                  <select value={selectedExpertise} onChange={e => setSelectedExpertise(e.target.value)}
                    disabled={!selectedSubDepartment} required style={{ ...inp, opacity: selectedSubDepartment ? 1 : 0.5 }}>
                    <option value="">Select</option>
                    {availableExpertise.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              {/* Banking */}
              <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:"0.07em", textTransform:"uppercase" }}>Banking</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
                {[
                  { label:"Bkash Number",       name:"bkash" },
                  { label:"Nagad Number",        name:"nogod" },
                  { label:"Bank Name",           name:"bankn" },
                  { label:"Bank Account Number", name:"bacc"  },
                ].map(({ label, name }) => (
                  <div key={name}>
                    <label style={lbl}>{label}</label>
                    <input name={name} style={fi(name)} placeholder="—"
                      onFocus={() => setFocused(name)} onBlur={() => setFocused(null)} />
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex:1, padding:"10px 0", borderRadius:9, border:"none", background:"#f1f3f8", color:"#475569", fontWeight:500, cursor:"pointer", fontSize:13 }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex:2, padding:"10px 0", borderRadius:9, border:"none", background:"#1e293b", color:"#fff", fontWeight:600, cursor:"pointer", fontSize:13 }}>
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </>
  );
};

export default Employeelist;