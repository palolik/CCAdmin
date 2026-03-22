import { useEffect, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { MdChat } from "react-icons/md";

import RichTextEditor from '../../userside/utils/PichTextEditor';
import { base_url } from "../../config/config";
import AdminempChat from "./adminempoyeechat";

// ── department data ───────────────────────────────────────────────────────────
const departmentData = [
  { department: "Web Development",        subDepartments: ["Frontend", "Backend", "Full Stack", "CMS Development"] },
  { department: "Graphic Design",         subDepartments: ["Social Media Design", "Post Design", "Logo Design", "UI/UX Design", "Print Design"] },
  { department: "Digital Marketing",      subDepartments: ["Cloud Company Marketing", "SEO", "Social Media Marketing", "Content Marketing", "Email Marketing", "Paid Ads (PPC)"] },
  { department: "Mobile App Development", subDepartments: ["Android Development", "iOS Development", "Cross-Platform Development"] },
  { department: "Video & Animation",      subDepartments: ["2D Animation", "3D Animation", "Explainer Videos", "Video Editing", "Motion Graphics"] },
  { department: "Content Writing",        subDepartments: ["Blog Writing", "Copywriting", "Technical Writing", "Product Descriptions"] },
  { department: "Data & Analytics",       subDepartments: ["Data Analysis", "Data Visualization", "Machine Learning", "AI Model Training"] },
  { department: "IT & Support",           subDepartments: ["Server Management", "Cloud Support", "Networking", "Technical Support"] },
];
const subdepartmentData = {
  "Frontend":["React","Angular","Vue.js","Next.js","Tailwind CSS"],
  "Backend":["Laravel","Node.js","PHP","Python","Express.js"],
  "Full Stack":["MERN Stack","MEAN Stack","LAMP Stack"],
  "CMS Development":["WordPress","Shopify","Wix","Joomla"],
  "Social Media Design":["DP","Cover","Instagram Posts","Story Templates"],
  "Post Design":["Banner","Flyer","Poster","Brochure"],
  "Logo Design":["Logo Creation","Branding","Icon Design"],
  "UI/UX Design":["Wireframing","Prototyping","Figma","Adobe XD"],
  "Print Design":["Business Cards","Letterheads","Magazine Layouts"],
  "Cloud Company Marketing":["Brand Promotion","Campaigns","Analytics"],
  "SEO":["On-Page SEO","Off-Page SEO","Keyword Research","Technical SEO"],
  "Social Media Marketing":["Facebook Ads","Instagram Growth","LinkedIn Marketing"],
  "Content Marketing":["Blog Strategy","Content Planning","Copy Optimization"],
  "Email Marketing":["Mailchimp","Automation","Cold Outreach"],
  "Paid Ads (PPC)":["Google Ads","YouTube Ads","Facebook Ads"],
  "Android Development":["Kotlin","Java","Android Studio"],
  "iOS Development":["Swift","Objective-C","Xcode"],
  "Cross-Platform Development":["Flutter","React Native","Ionic"],
  "2D Animation":["Character Animation","Explainer Animations"],
  "3D Animation":["Modeling","Rendering","Rigging"],
  "Explainer Videos":["Storyboard","Voice Over","Motion Graphics"],
  "Video Editing":["Premiere Pro","After Effects","DaVinci Resolve"],
  "Motion Graphics":["Text Animation","Logo Animation","Transitions"],
  "Blog Writing":["SEO Blogs","Technical Blogs","Long-form Articles"],
  "Copywriting":["Sales Copy","Website Copy","Ad Copy"],
  "Technical Writing":["API Docs","Software Manuals","User Guides"],
  "Product Descriptions":["E-commerce Copy","Amazon Listings"],
  "Data Analysis":["Excel","Python","Power BI","SQL"],
  "Data Visualization":["Tableau","Google Data Studio","D3.js"],
  "Machine Learning":["TensorFlow","Scikit-learn","Keras"],
  "AI Model Training":["Data Labeling","Model Tuning","Evaluation"],
  "Server Management":["Linux","cPanel","AWS EC2"],
  "Cloud Support":["AWS","Azure","Google Cloud"],
  "Networking":["Cisco","Network Setup","Troubleshooting"],
  "Technical Support":["Remote Support","System Maintenance","Bug Fixing"],
};

// ── status config ─────────────────────────────────────────────────────────────
const statusStyle = {
  pending:   { bg:"#fff7ed", color:"#c2410c", border:"#fed7aa" },
  Accepted:  { bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" },
  Completed: { bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0" },
};

const lbl = { display:"block", fontSize:11, color:"#94a3b8", marginBottom:4, fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase" };
const inp = { width:"100%", border:"1px solid #e2e5ee", borderRadius:8, padding:"8px 12px", fontSize:13.5, fontFamily:"inherit", background:"#fafbfd", outline:"none", boxSizing:"border-box", color:"#1e293b" };

const formatDate = (ds) => {
  if (!ds || ds === "NA") return "—";
  const d = new Date(ds);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit", hour12:true });
};

// ── task row ──────────────────────────────────────────────────────────────────
const TaskRow = ({ task, onDelete, onChatClick, onExtraTime }) => {
  const [open, setOpen] = useState(false);
  const st = statusStyle[task.tstatus] || { bg:"#f8fafc", color:"#64748b", border:"#e2e8f0" };

  return (
    <>
      {/* ── summary row — always visible ── */}
      <tr
        className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        {/* expand chevron + name */}
        <td style={{ padding:"14px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{
              fontSize:11, color:"#94a3b8", transition:"transform .2s",
              display:"inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)",
            }}>▶</span>
            <div>
              <p style={{ margin:0, fontWeight:600, fontSize:13.5, color:"#1e293b" }}>{task.tname}</p>
              <p style={{ margin:0, fontSize:11, color:"#94a3b8", marginTop:2, fontFamily:"monospace" }}>
                {task._id?.slice(-8)}
              </p>
            </div>
          </div>
        </td>

        {/* dept */}
        <td style={{ padding:"14px 16px" }}>
          <p style={{ margin:0, fontSize:13, color:"#334155" }}>{task.rdep}</p>
          <p style={{ margin:"2px 0 0", fontSize:11, color:"#94a3b8" }}>{task.rsubdep} · {task.esprts}</p>
        </td>

        {/* time + cc */}
        <td style={{ padding:"14px 16px" }}>
          <span style={{ fontSize:12, background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", borderRadius:999, padding:"2px 10px", fontWeight:600, marginRight:6 }}>
            ⏱ {task.ttime}h
          </span>
          <span style={{ fontSize:12, background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", borderRadius:999, padding:"2px 10px", fontWeight:600 }}>
            💰 {task.tcc} CC
          </span>
        </td>

        {/* accepted by */}
        <td style={{ padding:"14px 16px" }}>
          {task.apname ? (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src={task.apdp || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                style={{ width:30, height:30, borderRadius:"50%", objectFit:"cover", border:"1.5px solid #e8eaf0" }}
                onError={e => { e.target.src="https://cdn-icons-png.flaticon.com/512/847/847969.png"; }} />
              <div>
                <p style={{ margin:0, fontSize:13, fontWeight:500, color:"#334155" }}>{task.apname}</p>
                <p style={{ margin:0, fontSize:10, color:"#94a3b8", fontFamily:"monospace" }}>{task.taptr?.slice(-6)}</p>
              </div>
            </div>
          ) : (
            <span style={{ fontSize:12, color:"#cbd5e1", fontStyle:"italic" }}>Unassigned</span>
          )}
        </td>

        {/* status */}
        <td style={{ padding:"14px 16px" }}>
          <span style={{ fontSize:11.5, fontWeight:600, padding:"3px 12px", borderRadius:999,
            background: st.bg, color: st.color, border:`1px solid ${st.border}` }}>
            {task.tstatus}
          </span>
        </td>

        {/* actions — stop propagation so clicks don't toggle row */}
        <td style={{ padding:"14px 16px" }} onClick={e => e.stopPropagation()}>
          <div style={{ display:"flex", gap:6 }}>
            <button
              onClick={() => onChatClick(task._id)}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:7, border:"none",
                background:"#eff6ff", color:"#2563eb", fontWeight:500, fontSize:12, cursor:"pointer" }}>
              <MdChat size={13} /> Chat
            </button>
            <button
              onClick={() => onDelete(task._id)}
              style={{ padding:"5px 12px", borderRadius:7, border:"none",
                background:"#fef2f2", color:"#ef4444", fontWeight:500, fontSize:12, cursor:"pointer" }}>
              Delete
            </button>
          </div>
        </td>
      </tr>

      {/* ── expanded detail row ── */}
      {open && (
        <tr style={{ background:"#fafbfd" }}>
          <td colSpan={6} style={{ padding:"0 16px 16px 44px", borderBottom:"2px solid #e8eaf0" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, paddingTop:14 }}>

              {/* description */}
              <div style={{ gridColumn:"1 / -1" }}>
                <p style={{ ...lbl, marginBottom:6 }}>Task Description</p>
                {task.tdesc ? (
                  <div
                    className="prose max-w-none break-words [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                    style={{ fontSize:13, color:"#475569", lineHeight:1.7, background:"#fff", border:"1px solid #e8eaf0", borderRadius:10, padding:"10px 14px" }}
                    dangerouslySetInnerHTML={{ __html: task.tdesc }}
                  />
                ) : (
                  <span style={{ fontSize:12, color:"#cbd5e1", fontStyle:"italic" }}>No description</span>
                )}
              </div>

              {/* timing */}
              <div>
                <p style={lbl}>Timing</p>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {[
                    ["Created",   formatDate(task.tmt)],
                    ["Accepted",  formatDate(task.tat)],
                    ["Completed", formatDate(task.completedAt)],
                    ["Deadline",  task.tat && task.tat !== "NA"
                      ? formatDate(new Date(new Date(task.tat).getTime() + Number(task.ttime) * 3600000))
                      : "—"],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:"flex", justifyContent:"space-between", fontSize:12, borderBottom:"1px solid #f0f2f7", paddingBottom:3 }}>
                      <span style={{ color:"#94a3b8" }}>{label}</span>
                      <span style={{ color:"#334155", fontWeight:500 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* follow-up */}
              <div>
                <p style={lbl}>Follow-up For</p>
                <p style={{ fontSize:13, color:"#475569", fontFamily:"monospace", background:"#f8fafc", border:"1px solid #e8eaf0", borderRadius:8, padding:"8px 12px", margin:0 }}>
                  {task.tfid || "—"}
                </p>
              </div>

              {/* more time request */}
              {task.tmoretime && (
                <div>
                  <p style={lbl}>More Time Request</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <span style={{ fontSize:12, color:"#c2410c", background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:999, padding:"2px 10px", width:"fit-content" }}>
                      Employee requested extra time
                    </span>
                    <select
                      style={{ ...inp, fontSize:12 }}
                      onChange={e => { if (e.target.value) onExtraTime(task._id, e.target.value); }}
                      defaultValue=""
                    >
                      <option value="">+ Add Extra Time</option>
                      {["5","10","15","20"].map(h => <option key={h} value={h}>+{h} hours</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ── main component ────────────────────────────────────────────────────────────
const WorkDis = () => {
  const loaderTasks = useLoaderData();
  const [tasks, setTasks]                           = useState(loaderTasks || []);
  const [showForm, setShowForm]                     = useState(false);
  const [formData, setFormData]                     = useState({ tdesc:"" });
  const [activeChatTasks, setActiveChatTasks]       = useState([]);
  const [chatVisibility, setChatVisibility]         = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSubDepartment, setSelectedSubDepartment] = useState("");
  const [selectedExpertise, setSelectedExpertise]   = useState("");
  const [availableExpertise, setAvailableExpertise] = useState([]);
  const [search, setSearch]                         = useState("");
  const [filterStatus, setFilterStatus]             = useState("All");
  const [focused, setFocused]                       = useState(null);

  const fi = (name) => focused === name
    ? { ...inp, borderColor:"#6366f1", boxShadow:"0 0 0 3px rgba(99,102,241,.1)", background:"#fff" }
    : inp;

  const formatDateTime = (d) => {
    const y = d.getFullYear(), mo = String(d.getMonth()+1).padStart(2,'0'),
          dd = String(d.getDate()).padStart(2,'0'),
          h  = String(d.getHours()).padStart(2,'0'), mi = String(d.getMinutes()).padStart(2,'0');
    return `${y}-${mo}-${dd}T${h}:${mi}:00`;
  };

  useEffect(() => {
    fetch(`${base_url}/alltasks`).then(r => r.json()).then(setTasks).catch(console.error);
  }, []);

  useEffect(() => { setSelectedSubDepartment(""); setSelectedExpertise(""); setAvailableExpertise([]); }, [selectedDepartment]);
  useEffect(() => { setAvailableExpertise(subdepartmentData[selectedSubDepartment] || []); setSelectedExpertise(""); }, [selectedSubDepartment]);

  const handleAddPost = async (e) => {
    e.preventDefault();
    const form = e.target;
    const postData = {
      tname: form.tname.value.trim(), tdesc: formData.tdesc,
      rdep: selectedDepartment, rsubdep: selectedSubDepartment, esprts: selectedExpertise,
      ttime: form.ttime.value.trim(), tcc: form.tcc.value.trim(), tfid: form.tfid.value.trim(),
      taptr:"NA", tmt: formatDateTime(new Date()), tdt:"NA", tstatus:"pending",
    };
    try {
      const res  = await fetch(`${base_url}/addtask`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(postData) });
      const data = await res.json();
      if (data.insertedId) {
        Swal.fire("Success","New task added!","success");
        setTasks(prev => [...prev, { ...postData, _id: data.insertedId }]);
        form.reset(); setFormData({ tdesc:"" });
        setSelectedDepartment(""); setSelectedSubDepartment(""); setSelectedExpertise("");
        setShowForm(false);
      } else { Swal.fire("Error","Could not add task","error"); }
    } catch { Swal.fire("Error","Unexpected error","error"); }
  };

  const handleDelete = (_id) => {
    Swal.fire({ title:"Delete this task?", text:"This cannot be undone.", icon:"warning", showCancelButton:true, confirmButtonColor:"#ef4444", confirmButtonText:"Delete" })
    .then(({ isConfirmed }) => {
      if (!isConfirmed) return;
      fetch(`${base_url}/deltask/${_id}`, { method:"DELETE" }).then(r => r.json()).then(data => {
        if (data.deletedCount > 0) { Swal.fire("Deleted!","","success"); setTasks(prev => prev.filter(t => t._id !== _id)); }
      });
    });
  };

  const handleChatClick = (taskid) => {
    if (!activeChatTasks.includes(taskid)) setActiveChatTasks(prev => [...prev, taskid]);
    setChatVisibility(prev => ({ ...prev, [taskid]: true }));
  };
  const closeChat = (taskid) => {
    setActiveChatTasks(prev => prev.filter(t => t !== taskid));
    setChatVisibility(prev => { const n = {...prev}; delete n[taskid]; return n; });
  };
  const toggleChatVisibility = (taskid) => setChatVisibility(prev => ({ ...prev, [taskid]: !prev[taskid] }));

  const handleExtraTime = async (taskId, extraTime) => {
    try {
      const res  = await fetch(`${base_url}/addmoretime/${taskId}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ extraTime }) });
      const data = await res.json();
      if (data.success) { Swal.fire("Success",`+${extraTime}h added!`,"success"); window.location.reload(); }
      else Swal.fire("Error","Failed to add time","error");
    } catch { Swal.fire("Error","Unexpected error","error"); }
  };

  const statuses = ["All","pending","Accepted","Completed"];
  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = (t.tname||"").toLowerCase().includes(q) || (t._id||"").toLowerCase().includes(q) || (t.apname||"").toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || t.tstatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = { All: tasks.length, pending: tasks.filter(t=>t.tstatus==="pending").length, Accepted: tasks.filter(t=>t.tstatus==="Accepted").length, Completed: tasks.filter(t=>t.tstatus==="Completed").length };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700&display=swap');
        .wd-wrap { font-family:'DM Sans',sans-serif; background:#f7f8fb; min-height:100vh; }
        .wd-syne { font-family:'Syne',sans-serif; }
        .wd-card { background:#fff; border:1px solid #e8eaf0; border-radius:16px; overflow:hidden; }
        .wd-search { border:1px solid #e2e5ee; border-radius:9px; padding:8px 14px; font-size:13px; font-family:'DM Sans',sans-serif; background:#fafbfd; outline:none; width:220px; color:#1e293b; transition:border-color .2s; }
        .wd-search:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); background:#fff; }
        .wd-chip { padding:5px 14px; border-radius:999px; font-size:12.5px; font-weight:500; border:1.5px solid #e2e5ee; background:#fff; color:#64748b; cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif; }
        .wd-chip:hover,.wd-chip.on { border-color:#1e293b; background:#1e293b; color:#fff; }
        .wd-addbtn { padding:9px 20px; border-radius:9px; border:none; background:#1e293b; color:#fff; font-weight:600; font-size:13px; font-family:'DM Sans',sans-serif; cursor:pointer; transition:background .2s; }
        .wd-addbtn:hover { background:#334155; }
        @keyframes wd-up { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
      `}</style>

      <div className="wd-wrap w-full">
        <div className="hdr">Work Distribution</div>

        <div style={{ padding:"20px 28px 28px" }}>

          {/* ── stats ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
            {[
              { label:"Total Tasks",  value: counts.All,       color:"#1e293b" },
              { label:"Pending",      value: counts.pending,   color:"#c2410c" },
              { label:"Accepted",     value: counts.Accepted,  color:"#1d4ed8" },
              { label:"Completed",    value: counts.Completed, color:"#15803d" },
            ].map(s => (
              <div key={s.label} style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:14, padding:"16px 20px" }}>
                <p style={{ margin:0, fontSize:11, color:"#94a3b8", fontWeight:500, marginBottom:4 }}>{s.label}</p>
                <p className="wd-syne" style={{ margin:0, fontSize:22, fontWeight:700, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── toolbar ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <input className="wd-search" placeholder="Search name, ID, employee…" value={search} onChange={e => setSearch(e.target.value)} />
              <div style={{ display:"flex", gap:6 }}>
                {statuses.map(s => (
                  <button key={s} className={`wd-chip ${filterStatus===s?"on":""}`} onClick={() => setFilterStatus(s)}>
                    {s} <span style={{ opacity:.6, marginLeft:3 }}>{counts[s]}</span>
                  </button>
                ))}
              </div>
            </div>
            <button className="wd-addbtn" onClick={() => setShowForm(true)}>+ Add Task</button>
          </div>

          {/* ── table ── */}
          <div className="wd-card">
            {filtered.length === 0 ? (
              <div style={{ padding:"56px 0", textAlign:"center", color:"#94a3b8", fontSize:14 }}>No tasks found.</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #f0f2f7" }}>
                    {["Task","Department","Time / CC","Assigned To","Status","Actions"].map(h => (
                      <th key={h} style={{ textAlign:"left", padding:"12px 16px", fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:"0.07em", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(task => (
                    <TaskRow
                      key={task._id}
                      task={task}
                      onDelete={handleDelete}
                      onChatClick={handleChatClick}
                      onExtraTime={handleExtraTime}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Task Modal ── */}
      {showForm && createPortal(
        <div
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:99999, padding:16 }}
        >
          <div style={{ background:"#fff", borderRadius:18, padding:32, width:"100%", maxWidth:700, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,.2)", fontFamily:"'DM Sans',sans-serif", animation:"wd-up .2s ease" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <h2 className="wd-syne" style={{ margin:0, fontSize:18, fontWeight:700, color:"#1e293b" }}>Add New Task</h2>
              <button onClick={() => setShowForm(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#94a3b8", padding:0 }}>✕</button>
            </div>

            <form onSubmit={handleAddPost}>
              <p style={{ ...lbl, marginBottom:10 }}>Basic Info</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                <div>
                  <label style={lbl}>Follow-up Task For</label>
                  <input name="tfid" style={fi("tfid")} placeholder="Order or Task ID" onFocus={()=>setFocused("tfid")} onBlur={()=>setFocused(null)} />
                </div>
                <div>
                  <label style={lbl}>Task Name *</label>
                  <input name="tname" required style={fi("tname")} placeholder="e.g. Build login page" onFocus={()=>setFocused("tname")} onBlur={()=>setFocused(null)} />
                </div>
                <div>
                  <label style={lbl}>Required Time (Hours) *</label>
                  <input name="ttime" type="number" required style={fi("ttime")} placeholder="e.g. 8" onFocus={()=>setFocused("ttime")} onBlur={()=>setFocused(null)} />
                </div>
                <div>
                  <label style={lbl}>Allocated CC *</label>
                  <input name="tcc" type="number" required style={fi("tcc")} placeholder="e.g. 50" onFocus={()=>setFocused("tcc")} onBlur={()=>setFocused(null)} />
                </div>
              </div>

              <p style={{ ...lbl, marginBottom:10 }}>Department</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:18 }}>
                <div>
                  <label style={lbl}>Department *</label>
                  <select value={selectedDepartment} onChange={e=>setSelectedDepartment(e.target.value)} required style={inp}>
                    <option value="">Select</option>
                    {departmentData.map(d => <option key={d.department}>{d.department}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Sub Department *</label>
                  <select value={selectedSubDepartment} onChange={e=>setSelectedSubDepartment(e.target.value)} disabled={!selectedDepartment} required style={{ ...inp, opacity: selectedDepartment?1:.5 }}>
                    <option value="">Select</option>
                    {departmentData.find(d=>d.department===selectedDepartment)?.subDepartments.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Expertise *</label>
                  <select value={selectedExpertise} onChange={e=>setSelectedExpertise(e.target.value)} disabled={!selectedSubDepartment} required style={{ ...inp, opacity: selectedSubDepartment?1:.5 }}>
                    <option value="">Select</option>
                    {availableExpertise.map(e=><option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              <p style={{ ...lbl, marginBottom:10 }}>Task Description</p>
              <div style={{ height:240, marginBottom:24 }}>
                <RichTextEditor name="tdesc" value={formData.tdesc} onChange={v => setFormData(p=>({...p, tdesc:v}))} />
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>setShowForm(false)} style={{ flex:1, padding:"10px 0", borderRadius:9, border:"none", background:"#f1f3f8", color:"#475569", fontWeight:500, cursor:"pointer", fontSize:13 }}>Cancel</button>
                <button type="submit" style={{ flex:2, padding:"10px 0", borderRadius:9, border:"none", background:"#1e293b", color:"#fff", fontWeight:600, cursor:"pointer", fontSize:13 }}>Add Task</button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* ── floating chat windows ── */}
      <div className="flex flex-row-reverse items-end fixed right-20 bottom-0 ">
        {activeChatTasks.map(taskId => {
          const t = tasks.find(task => task._id === taskId);
          return (
            <AdminempChat key={taskId} taskid={t?._id||''} emid={t?.taptr||''} dp={t?.apdp||''} name={t?.apname||'Unknown'} tname={t?.tname||''} tdesc={t?.tdesc||''} isVisible={chatVisibility[taskId]} onClose={()=>closeChat(taskId)} onToggle={()=>toggleChatVisibility(taskId)} />
          );
        })}
      </div>
    </>
  );
};

export default WorkDis;