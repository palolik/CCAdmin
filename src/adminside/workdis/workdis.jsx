/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import { useLoaderData } from "react-router-dom";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { MdChat } from "react-icons/md";

import RichTextEditor from '../../userside/utils/PichTextEditor';
import { base_url } from "../../config/config";
import AdminempChat from "./adminempoyeechat";
import CountdownTimer from "../../userside/utils/CountdownTimer";
import { departmentData, subdepartmentData } from "./departments";


const statusStyle = {
  draft:      { bg:"#f1f5f9", color:"#475569", border:"#cbd5e1" },
  pending:    { bg:"#f8fafc", color:"#334155", border:"#e2e8f0" },
  Accepted:   { bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" },
  VerifyTask: { bg:"#dbeafe", color:"#1e40af", border:"#93c5fd" },
  Completed:  { bg:"#2563eb", color:"#ffffff", border:"#2563eb" },
  Done:       { bg:"#1e293b", color:"#ffffff", border:"#1e293b" },
};

const lbl = { display:"block", fontSize:11, color:"#94a3b8", marginBottom:4, fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase" };
const inp = { width:"100%", border:"1px solid #e2e8f0", borderRadius:8, padding:"8px 12px", fontSize:13.5, fontFamily:"inherit", background:"#fafbfd", outline:"none", boxSizing:"border-box", color:"#1e293b" };

const formatDate = (ds) => {
  if (!ds || ds === "NA") return "—";
  const d = new Date(ds);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit", hour12:true });
};

const DEFAULT_DP = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

// Board columns, left to right. Backlog holds drafts: name-only tasks that
// employees can't see until they're filled in and moved to To Do. "not activated" (follow-up tasks waiting on
// their parent) only shows when there is one.
const columns = [
  { status:"draft",         title:"Backlog" },
  { status:"not activated", title:"Not Activated" },
  { status:"pending",       title:"To Do" },
  { status:"Accepted",      title:"In Progress" },
  { status:"VerifyTask",    title:"In Review" },
  { status:"Completed",     title:"Completed" },
  { status:"Done",          title:"Done" },
];

const deadlineOf = (task) => new Date(new Date(task.tat).getTime() + Number(task.ttime) * 3600000);

// ── TaskCard — one draggable card on the board ───────────────
const TaskCard = ({ task, onOpen, onDelete, onChatClick, onVerify, onExtendTime, onReassign, unreadCount, onDragStart, onDragEnd, dragging }) => {
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

  return (
    <div
      className="wd-task"
      draggable
      onDragStart={e => onDragStart(e, task._id)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task._id)}
      style={{ opacity: dragging ? .4 : 1 }}
    >
      <p style={{ margin:0, fontWeight:600, fontSize:13.5, color:"#1e293b", lineHeight:1.35 }}>{task.tname}</p>
      <p style={{ margin:"4px 0 0", fontSize:11, color:"#94a3b8" }}>{task.rdep} · {task.rsubdep}{task.esprts ? ` · ${task.esprts}` : ""}</p>

      <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
        <span className="wd-pill" style={{ background:"#eff6ff", color:"#2563eb", borderColor:"#bfdbfe" }}>⏱ {task.ttime}h</span>
        <span className="wd-pill" style={{ background:"#eff6ff", color:"#2563eb", borderColor:"#bfdbfe" }}>💰 {task.tcc} CC</span>
        {task.tmoretime && <span className="wd-pill" style={{ background:"#f8fafc", color:"#334155", borderColor:"#e2e8f0" }}>More time asked</span>}
      </div>

      {task.tstatus === "draft" && missingFields(task).length > 0 && (
        <p style={{ margin:"8px 0 0", fontSize:11, color:"#334155" }}>Needs {missingFields(task).join(", ")}</p>
      )}

      {task.tstatus === "Accepted" && task.tat && task.tat !== "NA" && (
        <div style={{ marginTop:10, fontSize:12 }}>
          <CountdownTimer targetDate={deadlineOf(task)} />
        </div>
      )}

      {task.timeranout && task.tstatus === "Accepted" && (
        <div style={{ marginTop:8 }}>
          <p className="text-red-600 font-semibold text-xs" style={{ margin:"0 0 4px" }}>⏰ Time Ran Out</p>
          <div className="flex gap-1">
            <button onClick={stop(() => onExtendTime(task._id, task.tcc))} className="smbut">⏱ Extend</button>
            <button onClick={stop(() => onReassign(task._id))} className="smbut">🔄 Reassign</button>
          </div>
        </div>
      )}

      {task.tstatus === "VerifyTask" && (
        <div className="flex gap-1" style={{ marginTop:8 }}>
          <button onClick={stop(() => onVerify(task._id, "approve"))} className="smbut">✓ Approve</button>
          <button onClick={stop(() => onVerify(task._id, "reject"))} className="smbut">✗ Reject</button>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12, gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, minWidth:0 }}>
          {task.apname ? (
            <>
              <img
                src={task.apdp || DEFAULT_DP}
                title={task.apname}
                style={{ width:24, height:24, borderRadius:"50%", objectFit:"cover", border:"1.5px solid #e2e8f0", flexShrink:0 }}
                onError={e => { e.target.src = DEFAULT_DP; }}
              />
              <span style={{ fontSize:12, color:"#334155", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{task.apname}</span>
            </>
          ) : (
            <span style={{ fontSize:12, color:"#cbd5e1", fontStyle:"italic" }}>Unassigned</span>
          )}
        </div>
        <span style={{ fontSize:10.5, color:"#94a3b8", fontFamily:"monospace", flexShrink:0 }}>{task._id?.slice(-6)}</span>
      </div>

      <div style={{ display:"flex", gap:6, marginTop:10 }}>
        <button
          onClick={stop(() => onChatClick(task._id))}
          style={{ position:"relative", flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"4px 0", borderRadius:8, border:"none",
            background:"#f1f5f9", color:"#2563eb", fontWeight:500, fontSize:12, cursor:"pointer" }}
        >
          <MdChat size={13} /> Chat
          {unreadCount > 0 && (
            <span style={{
              position:"absolute", top:-7, right:-7,
              background:"#ef4444", color:"#fff",
              fontSize:9, fontWeight:700,
              padding:"2px 5px", borderRadius:999,
              lineHeight:1, minWidth:16, textAlign:"center",
            }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={stop(() => onDelete(task._id))}
          style={{ padding:"4px 10px", borderRadius:8, border:"none",
            background:"#fef2f2", color:"#ef4444", fontWeight:500, fontSize:12, cursor:"pointer" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Fields a task needs before it can leave the Backlog (same list the server checks).
const requiredFields = { tname:"name", rdep:"department", rsubdep:"sub department", ttime:"time", tcc:"CC" };
const missingFields = (task) => Object.entries(requiredFields)
  .filter(([field]) => !String(task[field] ?? "").trim())
  .map(([, label]) => label);

const editableFrom = (task) => ({
  tname:  task.tname  || "",
  tdesc:  task.tdesc  || "",
  rdep:   task.rdep   || "",
  rsubdep:task.rsubdep|| "",
  esprts: task.esprts || "",
  ttime:  task.ttime  ?? "",
  tcc:    task.tcc    ?? "",
  tfid:   task.tfid   || "",
  taptr:  task.taptr && task.taptr !== "NA" ? task.taptr : "",
});

// Keeps a saved value selectable even when it isn't in the preset lists.
const withCurrent = (options, current) => (current && !options.includes(current) ? [current, ...options] : options);

// ── TaskDetails — edit popup opened by clicking a card ────────
const TaskDetails = ({ task, employees, onClose, onSave, onExtraTime }) => {
  const st = statusStyle[task.tstatus] || { bg:"#f8fafc", color:"#64748b", border:"#e2e8f0" };
  const column = columns.find(c => c.status === task.tstatus);
  const [form, setForm] = useState(() => editableFrom(task));
  const [saving, setSaving] = useState(false);
  const canAssign = ["draft","pending"].includes(task.tstatus);

  const initial = editableFrom(task);
  const dirty = Object.keys(form).some(k => String(form[k]) !== String(initial[k]));
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const departments    = withCurrent(departmentData.map(d => d.department), form.rdep);
  const subDepartments = withCurrent(departmentData.find(d => d.department === form.rdep)?.subDepartments || [], form.rsubdep);
  const expertise      = withCurrent(subdepartmentData[form.rsubdep] || [], form.esprts);

  const save = async (e) => {
    e.preventDefault();
    const changes = Object.fromEntries(Object.entries(form).filter(([k, v]) => String(v) !== String(initial[k])));
    if (changes.taptr !== undefined) {
      const emp = employees.find(em => em._id === changes.taptr);
      Object.assign(changes, { apname: emp?.rname || "", apdp: emp?.rppic || "" });
    }
    setSaving(true);
    try {
      await onSave(task._id, changes);
      Swal.fire({ icon:"success", title:"Saved", timer:1200, showConfirmButton:false });
    } catch (err) {
      Swal.fire("Error!", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const missing = task.tstatus === "draft" ? missingFields(form) : [];

  return createPortal(
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1050, padding:16 }}
    >
      <form onSubmit={save} style={{ background:"#fff", borderRadius:18, padding:28, width:"100%", maxWidth:760, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,.2)", fontFamily:"'DM Sans',sans-serif", animation:"wd-up .2s ease" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:11.5, fontWeight:600, padding:"3px 12px", borderRadius:999, background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
              {column?.title || task.tstatus}
            </span>
            <span style={{ fontSize:11, color:"#94a3b8", fontFamily:"monospace" }}>{task._id}</span>
          </div>
          <button type="button" onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#94a3b8", padding:0 }}>✕</button>
        </div>

        <input
          value={form.tname}
          onChange={set("tname")}
          required
          placeholder="Task name"
          className="wd-syne"
          style={{ ...inp, fontSize:18, fontWeight:700, border:"1px solid transparent", background:"transparent", padding:"6px 8px", marginLeft:-8, width:"calc(100% + 8px)" }}
          onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
          onBlur={e => { e.target.style.borderColor = "transparent"; e.target.style.background = "transparent"; }}
        />

        {missing.length > 0 && (
          <p style={{ fontSize:12, color:"#334155", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 10px", margin:"8px 0 0" }}>
            Fill in {missing.join(", ")} before moving it to To Do.
          </p>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:12, marginTop:18 }}>
          <div>
            <label style={lbl}>Department</label>
            <select value={form.rdep} onChange={e => setForm(f => ({ ...f, rdep:e.target.value, rsubdep:"", esprts:"" }))} style={inp}>
              <option value="">Select</option>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Sub Department</label>
            <select value={form.rsubdep} onChange={e => setForm(f => ({ ...f, rsubdep:e.target.value, esprts:"" }))} disabled={!form.rdep} style={{ ...inp, opacity: form.rdep ? 1 : .5 }}>
              <option value="">Select</option>
              {subDepartments.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Expertise</label>
            <select value={form.esprts} onChange={set("esprts")} disabled={!form.rsubdep} style={{ ...inp, opacity: form.rsubdep ? 1 : .5 }}>
              <option value="">Select</option>
              {expertise.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Time (hours)</label>
            <input type="number" min="0" value={form.ttime} onChange={set("ttime")} style={inp} placeholder="e.g. 8" />
          </div>
          <div>
            <label style={lbl}>Allocated CC</label>
            <input type="number" min="0" value={form.tcc} onChange={set("tcc")} style={inp} placeholder="e.g. 50" />
          </div>
          <div>
            <label style={lbl}>Follow-up For</label>
            <input value={form.tfid} onChange={set("tfid")} style={inp} placeholder="Order or Task ID" />
          </div>
          <div>
            <label style={lbl}>Assignee</label>
            <select
              value={form.taptr}
              onChange={set("taptr")}
              disabled={!canAssign}
              title={canAssign ? "" : "Already started; use Reassign on the card"}
              style={{ ...inp, opacity: canAssign ? 1 : .6 }}
            >
              <option value="">{canAssign ? "Open for all" : task.apname || "—"}</option>
              {canAssign && employees.map(emp => <option key={emp._id} value={emp._id}>{emp.rname}</option>)}
            </select>
          </div>
        </div>

        <p style={{ ...lbl, marginTop:18, marginBottom:6 }}>Description</p>
        <div style={{ height:220, marginBottom:52 }}>
          <RichTextEditor name="tdesc" value={form.tdesc} onChange={v => setForm(f => ({ ...f, tdesc: v === "<p><br></p>" ? "" : v }))} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16 }}>
          <div>
            <p style={lbl}>Timing</p>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {[
                ["Created",   formatDate(task.tmt)],
                ["Accepted",  formatDate(task.tat)],
                ["Completed", formatDate(task.completedAt)],
                ["Deadline",  task.tat && task.tat !== "NA" ? formatDate(deadlineOf(task)) : "—"],
              ].map(([label, val]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", fontSize:12, borderBottom:"1px solid #eff6ff", paddingBottom:3 }}>
                  <span style={{ color:"#94a3b8" }}>{label}</span>
                  <span style={{ color:"#334155", fontWeight:500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {task.tmoretime && (
            <div>
              <p style={lbl}>More Time Request</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <span style={{ fontSize:12, color:"#334155", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:999, padding:"2px 10px", width:"fit-content" }}>
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

        <div style={{ display:"flex", gap:10, marginTop:24, position:"sticky", bottom:-28, background:"#fff", padding:"12px 0 4px" }}>
          <button type="button" onClick={onClose} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", background:"#f1f5f9", color:"#475569", fontWeight:500, cursor:"pointer", fontSize:12 }}>Close</button>
          <button type="submit" disabled={!dirty || saving} style={{ flex:2, padding:"8px 0", borderRadius:8, border:"none", background: dirty ? "#0f172a" : "#cbd5e1", color:"#fff", fontWeight:500, cursor: dirty ? "pointer" : "default", fontSize:12 }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  , document.body);
};

// ── QuickAdd — create backlog tasks by name, one after another ─
const QuickAdd = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  // Stay in the box after each Enter so several tasks can be typed in a row.
  useEffect(() => { if (open && !busy) inputRef.current?.focus(); }, [open, busy]);

  const submit = async (e) => {
    e.preventDefault();
    const tname = name.trim();
    if (!tname || busy) return;
    setBusy(true);
    const ok = await onCreate(tname);
    setBusy(false);
    if (ok) setName("");
  };

  if (!open) {
    return (
      <button type="button" className="wd-quick" onClick={() => setOpen(true)}>+ Create task</button>
    );
  }
  return (
    <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <input
        ref={inputRef}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Escape") { setOpen(false); setName(""); } }}
        onBlur={() => { if (!name.trim()) setOpen(false); }}
        placeholder="What needs to be done?"
        readOnly={busy}
        style={{ ...inp, background:"#fff", borderColor:"#3b82f6", boxShadow:"0 0 0 3px rgba(59, 130, 246,.1)" }}
      />
      <p style={{ margin:0, fontSize:10.5, color:"#94a3b8" }}>Enter to add · Esc to close</p>
    </form>
  );
};

// ── Main Component ────────────────────────────────────────────
const WorkDis = () => {
  const loaderTasks = useLoaderData();
  const [tasks, setTasks]                                 = useState(loaderTasks || []);
  const [showForm, setShowForm]                           = useState(false);
  const [formData, setFormData]                           = useState({ tdesc:"" });
  const [activeChatTasks, setActiveChatTasks]             = useState([]);
  const [chatVisibility, setChatVisibility]               = useState({});
  const [selectedDepartment, setSelectedDepartment]       = useState("");
  const [selectedSubDepartment, setSelectedSubDepartment] = useState("");
  const [selectedExpertise, setSelectedExpertise]         = useState("");
  const [availableExpertise, setAvailableExpertise]       = useState([]);
  const [search, setSearch]                               = useState("");
  const [focused, setFocused]                             = useState(null);
  const [unreadCounts, setUnreadCounts]                   = useState({});
  const [employees, setEmployees]                         = useState([]);
const [selectedEmployee, setSelectedEmployee] = useState(""); // "" = open for all
  const [openTaskId, setOpenTaskId]                       = useState(null);
  const [draggingId, setDraggingId]                       = useState(null);
  const [dragOverStatus, setDragOverStatus]               = useState(null);
  const tasksRef = useRef([]);
  tasksRef.current = tasks;

  const fi = (name) => focused === name
    ? { ...inp, borderColor:"#3b82f6", boxShadow:"0 0 0 3px rgba(59, 130, 246,.1)", background:"#fff" }
    : inp;

  const formatDateTime = (date) => date.toISOString();

  // ── Fetch helpers ─────────────────────────────────────────
  const fetchTasks = () => {
    fetch(`${base_url}/alltasks`)
      .then(r => r.json())
      .then(setTasks)
      .catch(console.error);
  };

  useEffect(() => {
    fetch(`${base_url}/employees`)
      .then(r => r.json())
      .then(data => setEmployees(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => { fetchTasks(); }, []);

  const loadUnreadCounts = async () => {
    const allTasks = tasksRef.current;
    if (!allTasks.length) return;
    try {
      const results = await Promise.all(
        allTasks.map(async (task) => {
          try {
            const r = await fetch(`${base_url}/empchat/${task._id}`);
            if (!r.ok) return { id: task._id, count: 0 };
            const msgs = await r.json();
            const count = msgs.filter(m => m.sender === 'emp' && !m.read).length;
            return { id: task._id, count };
          } catch {
            return { id: task._id, count: 0 };
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
    if (!tasks.length) return;
    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, [tasks.length]);

  useEffect(() => { setSelectedSubDepartment(""); setSelectedExpertise(""); setAvailableExpertise([]); }, [selectedDepartment]);
  useEffect(() => { setAvailableExpertise(subdepartmentData[selectedSubDepartment] || []); setSelectedExpertise(""); }, [selectedSubDepartment]);

  // ── Task Handlers ─────────────────────────────────────────
  const handleVerifyTask = (_id, action) => {
    const isApprove = action === "approve";
    Swal.fire({
      title: isApprove ? "Approve this task?" : "Reject this task?",
      text: isApprove ? "Task will be marked as Completed." : "Task will be sent back to Accepted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isApprove ? undefined : "#dc2626",
      confirmButtonText: isApprove ? "Yes, Approve!" : "Yes, Reject!"
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${base_url}/verifytask/${_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        })
          .then(res => { if (!res.ok) throw new Error(); return res.json(); })
          .then(() => {
            Swal.fire(
              isApprove ? "Task Approved!" : "Task Rejected!",
              isApprove ? "Task marked as Completed." : "Task returned to Accepted.",
              "success"
            ).then(() => fetchTasks());
          })
          .catch(() => Swal.fire("Error!", "Something went wrong.", "error"));
      }
    });
  };

  const handleExtendTime = async (taskId, currentCC) => {
    const { value: formValues } = await Swal.fire({
      title: "Extend Time",
      html: `
        <label style="font-size:13px;color:#475569;display:block;text-align:left;margin-bottom:2px">Extra Hours</label>
        <input id="extraTime" type="number" min="1" placeholder="e.g. 2" class="swal2-input" />
        <label style="font-size:13px;color:#475569;display:block;text-align:left;margin-bottom:2px">Reduced CC (current: ${currentCC})</label>
        <input id="reducedCC" type="number" min="0" max="${currentCC}" placeholder="e.g. ${Math.floor(currentCC * 0.8)}" class="swal2-input" />
      `,
      showCancelButton: true,

      confirmButtonText: "Extend",
      preConfirm: () => {
        const extraTime = document.getElementById("extraTime").value;
        const reducedCC = document.getElementById("reducedCC").value;
        if (!extraTime || Number(extraTime) <= 0) {
          Swal.showValidationMessage("Please enter valid extra hours");
          return false;
        }
        if (Number(reducedCC) > Number(currentCC)) {
          Swal.showValidationMessage(`CC cannot exceed current value of ${currentCC}`);
          return false;
        }
        return { extraTime, reducedCC };
      }
    });

    if (!formValues) return;

    try {
      const res = await fetch(`${base_url}/addmoretime/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      if (!res.ok) throw new Error();
      Swal.fire("Extended!", `Added ${formValues.extraTime}h with reduced CC.`, "success")
        .then(() => fetchTasks());
    } catch {
      Swal.fire("Error!", "Failed to extend time.", "error");
    }
  };

  const handleReassign = async (taskId) => {
    if (!employees.length) {
      Swal.fire("Error", "No employees loaded.", "error");
      return;
    }

    const { value: selectedId } = await Swal.fire({
      title: "Reassign Task",
      input: "select",
      inputOptions: Object.fromEntries(employees.map(e => [e._id, e.rname])),
      inputPlaceholder: "Select employee",
      showCancelButton: true,

      confirmButtonText: "Reassign",
    });

    if (!selectedId) return;
    const emp = employees.find(e => e._id === selectedId);
    if (!emp) return;

    try {
      const res = await fetch(`${base_url}/reassigntask/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmployeeId:   emp._id,
          newEmployeeName: emp.rname,
          newEmployeeDp:   emp.rppic,
        }),
      });
      if (!res.ok) throw new Error();
      Swal.fire("Reassigned!", `Task reassigned to ${emp.rname}.`, "success")
        .then(() => fetchTasks());
    } catch {
      Swal.fire("Error!", "Failed to reassign task.", "error");
    }
  };

const handleAddPost = async (e) => {
  e.preventDefault();
  const form = e.target;

  // Find the chosen employee (if any)
  const emp = selectedEmployee ? employees.find(em => em._id === selectedEmployee) : null;

  const postData = {
    tname: form.tname.value.trim(),
    tdesc: formData.tdesc,
    rdep: selectedDepartment,
    rsubdep: selectedSubDepartment,
    esprts: selectedExpertise,
    ttime: form.ttime.value.trim(),
    tcc: form.tcc.value.trim(),
    tfid: form.tfid.value.trim(),

    // 👇 Direct assignment vs open-for-all
    taptr:  emp ? emp._id   : "NA",
    apname: emp ? emp.rname : "",
    apdp:   emp ? emp.rppic : "",
    directAssigned: !!emp,        // optional flag — handy on the backend

    tmt: formatDateTime(new Date()),
    tdt: "NA",
    tstatus: "pending",
  };

  try {
    const res  = await fetch(`${base_url}/addtask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });
    const data = await res.json();
    if (data.insertedId) {
      Swal.fire(
        "Success",
        emp ? `Task assigned directly to ${emp.rname}!` : "New task added (open for all)!",
        "success"
      );
      setTasks(prev => [...prev, { ...postData, _id: data.insertedId }]);
      form.reset();
      setFormData({ tdesc: "" });
      setSelectedDepartment("");
      setSelectedSubDepartment("");
      setSelectedExpertise("");
      setSelectedEmployee(""); // 👈 reset
      setShowForm(false);
    } else {
      Swal.fire("Error", "Could not add task", "error");
    }
  } catch {
    Swal.fire("Error", "Unexpected error", "error");
  }
};
  const handleDelete = (_id) => {
    Swal.fire({ title:"Delete this task?", text:"This cannot be undone.", icon:"warning", showCancelButton:true, confirmButtonColor: "#dc2626", confirmButtonText:"Delete" })
    .then(({ isConfirmed }) => {
      if (!isConfirmed) return;
      fetch(`${base_url}/deltask/${_id}`, { method:"DELETE" })
        .then(r => r.json())
        .then(data => {
          if (data.deletedCount > 0) {
            Swal.fire("Deleted!","","success");
            setTasks(prev => prev.filter(t => t._id !== _id));
          }
        });
    });
  };

  const handleChatClick = (taskid) => {
    if (!activeChatTasks.includes(taskid)) setActiveChatTasks(prev => [...prev, taskid]);
    setChatVisibility(prev => ({ ...prev, [taskid]: true }));
    setUnreadCounts(prev => ({ ...prev, [taskid]: 0 }));
    fetch(`${base_url}/empchat/mark-read/${taskid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'emp' }),
    }).catch(err => console.error('Error marking as read:', err));
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
      if (data.success) {
        Swal.fire("Success",`+${extraTime}h added!`,"success").then(() => fetchTasks());
      } else {
        Swal.fire("Error","Failed to add time","error");
      }
    } catch {
      Swal.fire("Error","Unexpected error","error");
    }
  };

  // ── Board drag & drop ─────────────────────────────────────
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    setDraggingId(taskId);
  };

  const handleDragEnd = () => { setDraggingId(null); setDragOverStatus(null); };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggingId;
    handleDragEnd();
    if (taskId) moveTask(taskId, status);
  };

  // Optimistic: the card moves at once and goes back if the server refuses.
  const moveTask = async (taskId, status) => {
    const task = tasksRef.current.find(t => t._id === taskId);
    if (!task || task.tstatus === status) return;

    const needsEmployee = ["Accepted","VerifyTask","Completed","Done"].includes(status);
    if (needsEmployee && (!task.taptr || task.taptr === "NA")) {
      Swal.fire("Unassigned task", "Assign this task to an employee before moving it there.", "warning");
      return;
    }

    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, tstatus: status } : t));
    try {
      const res = await fetch(`${base_url}/taskstatus/${taskId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Could not move task (${res.status})`);
      if (data.task) setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...data.task, _id: t._id } : t));
      if (data.nextActivatedTaskId) fetchTasks();
    } catch (err) {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, tstatus: task.tstatus } : t));
      Swal.fire("Error!", err.message, "error");
    }
  };

  const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

  const handleSaveTask = async (taskId, changes) => {
    const res = await fetch(`${base_url}/task/${taskId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(changes) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Could not save task (${res.status})`);
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...data.task, _id: t._id } : t));
  };

  // Backlog quick add: name only, everything else is filled in later.
  const handleQuickCreate = async (tname) => {
    const draft = {
      tname, tdesc: "", rdep: "", rsubdep: "", esprts: "", ttime: "", tcc: "", tfid: "",
      taptr: "NA", apname: "", apdp: "", directAssigned: false,
      tmt: formatDateTime(new Date()), tdt: "NA", tstatus: "draft",
    };
    try {
      const res = await fetch(`${base_url}/addtask`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.insertedId) throw new Error(data.message || "Could not create task");
      setTasks(prev => [...prev, { ...draft, _id: data.insertedId }]);
      return true;
    } catch (err) {
      Swal.fire("Error", err.message, "error");
      return false;
    }
  };

  // ── Filters ───────────────────────────────────────────────
  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    return (t.tname||"").toLowerCase().includes(q) || (t._id||"").toLowerCase().includes(q) || (t.apname||"").toLowerCase().includes(q);
  });

  const visibleColumns = columns.filter(c => c.status !== "not activated" || tasks.some(t => t.tstatus === "not activated"));
  const openTask = tasks.find(t => t._id === openTaskId);

  const counts = {
    All:        tasks.length,
    draft:      tasks.filter(t=>t.tstatus==="draft").length,
    pending:    tasks.filter(t=>t.tstatus==="pending").length,
    Accepted:   tasks.filter(t=>t.tstatus==="Accepted").length,
    VerifyTask: tasks.filter(t=>t.tstatus==="VerifyTask").length,
    Completed:  tasks.filter(t=>t.tstatus==="Completed").length,
    Done:       tasks.filter(t=>t.tstatus==="Done").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700&display=swap');
        .wd-wrap { font-family:'DM Sans',sans-serif; background:#f7f8fb; min-height:100vh; }
        .wd-syne { font-family:'Syne',sans-serif; }
        .wd-search { border:1px solid #e2e8f0; border-radius:9px; padding:8px 14px; font-size:13px; font-family:'DM Sans',sans-serif; background:#fafbfd; outline:none; width:220px; color:#1e293b; transition:border-color .2s; }
        .wd-search:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59, 130, 246,.1); background:#fff; }
        .wd-board { display:flex; gap:14px; overflow-x:auto; padding-bottom:12px; align-items:flex-start; }
        .wd-col { flex:0 0 280px; background:#f1f5f9; border:1.5px solid transparent; border-radius:14px; padding:12px 10px; transition:background .15s, border-color .15s; }
        .wd-col.over { background:#dbeafe; border-color:#3b82f6; }
        .wd-task { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px; cursor:grab; box-shadow:0 1px 2px rgba(15,23,42,.05); transition:box-shadow .15s, opacity .15s; }
        .wd-task:hover { box-shadow:0 4px 12px rgba(15,23,42,.1); }
        .wd-task:active { cursor:grabbing; }
        .wd-quick { width:100%; text-align:left; padding:8px 10px; border:none; border-radius:8px; background:transparent; color:#64748b; font-size:12.5px; font-weight:500; font-family:'DM Sans',sans-serif; cursor:pointer; }
        .wd-quick:hover { background:#e2e8f0; color:#1e293b; }
        .wd-pill { font-size:11.5px; font-weight:600; border:1px solid; border-radius:999px; padding:1px 9px; }
        .wd-addbtn { padding:7px 14px; border-radius:8px; border:none; background:#0f172a; color:#fff; font-weight:500; font-size:12.5px; font-family:'DM Sans',sans-serif; cursor:pointer; transition:background .2s; }
        .wd-addbtn:hover { background:#334155; }
        @keyframes wd-up { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
      `}</style>

      <div className="wd-wrap w-full">
        <div className="hdr">Work Distribution</div>

        <div style={{ padding:"20px 28px 28px" }}>

          {/* Stat Cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:14, marginBottom:22 }}>
            {[
              { label:"Total Tasks",  value: counts.All,        color:"#1e293b" },
              { label:"Backlog",      value: counts.draft,      color:"#475569" },
              { label:"Pending",      value: counts.pending,    color:"#334155" },
              { label:"Accepted",     value: counts.Accepted,   color:"#1d4ed8" },
              { label:"Verify",       value: counts.VerifyTask, color:"#1d4ed8" },
              { label:"Completed",    value: counts.Completed,  color:"#1d4ed8" },
              { label:"Done",         value: counts.Done,       color:"#1d4ed8" },
            ].map(s => (
              <div key={s.label} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"16px 20px" }}>
                <p style={{ margin:0, fontSize:11, color:"#94a3b8", fontWeight:500, marginBottom:4 }}>{s.label}</p>
                <p className="wd-syne" style={{ margin:0, fontSize:22, fontWeight:700, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
            <input className="wd-search" placeholder="Search name, ID, employee…" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="wd-addbtn" onClick={() => setShowForm(true)}>+ Add Task</button>
          </div>

          {/* Board */}
          <div className="wd-board">
            {visibleColumns.map(col => {
              const colTasks = filtered.filter(t => t.tstatus === col.status);
              const st = statusStyle[col.status] || { color:"#64748b" };
              return (
                <div
                  key={col.status}
                  className={`wd-col ${dragOverStatus === col.status ? "over" : ""}`}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverStatus !== col.status) setDragOverStatus(col.status); }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverStatus(null); }}
                  onDrop={e => handleDrop(e, col.status)}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 4px 12px" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background: st.color === "#ffffff" ? st.bg : st.color }} />
                    <span style={{ fontSize:11.5, fontWeight:600, color:"#475569", letterSpacing:"0.06em", textTransform:"uppercase" }}>{col.title}</span>
                    <span style={{ fontSize:11.5, color:"#94a3b8", background:"#e2e8f0", borderRadius:999, padding:"0 8px" }}>{colTasks.length}</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10, minHeight:80 }}>
                    {colTasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onOpen={setOpenTaskId}
                        onDelete={handleDelete}
                        onChatClick={handleChatClick}
                        onVerify={handleVerifyTask}
                        onExtendTime={handleExtendTime}
                        onReassign={handleReassign}
                        unreadCount={unreadCounts[task._id] || 0}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        dragging={draggingId === task._id}
                      />
                    ))}
                    {colTasks.length === 0 && col.status !== "draft" && (
                      <div style={{ padding:"20px 0", textAlign:"center", color:"#cbd5e1", fontSize:12, border:"1.5px dashed #e2e8f0", borderRadius:10 }}>
                        Drop tasks here
                      </div>
                    )}
                    {col.status === "draft" && <QuickAdd onCreate={handleQuickCreate} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {openTask && (
        <TaskDetails
          key={openTask._id}
          task={openTask}
          employees={employees}
          onClose={() => setOpenTaskId(null)}
          onSave={handleSaveTask}
          onExtraTime={handleExtraTime}
        />
      )}

      {/* Add Task Modal */}
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

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr ", gap:12, marginBottom:18 }}>
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
                  <div>
  <label style={lbl}>Assign to Employee (Optional)</label>
  <select
    value={selectedEmployee}
    onChange={e => setSelectedEmployee(e.target.value)}
    style={inp}
  >
    <option value="">Open for all</option>
    {employees.map(emp => (
      <option key={emp._id} value={emp._id}>
        {emp.rname}
      </option>
    ))}
  </select>

  {selectedEmployee && (() => {
    const emp = employees.find(e => e._id === selectedEmployee);
    if (!emp) return null;
    return (
      <div style={{
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 8,
      }}>
        <img
          src={emp.rppic || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
          style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover", border:"1.5px solid #fff" }}
          onError={e => { e.target.src="https://cdn-icons-png.flaticon.com/512/847/847969.png"; }}
        />
        <div style={{ flex:1 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#1e3a8a" }}>{emp.rname}</p>

        </div>
        <button
          type="button"
          onClick={() => setSelectedEmployee("")}
          style={{
            border:"none", background:"transparent",
            color:"#0f172a", fontSize:12, cursor:"pointer", fontWeight:500,
          }}
        >
          Clear
        </button>
      </div>
    );
  })()}

                  </div>
              </div>

              <p style={{ ...lbl, marginBottom:10 }}>Task Description</p>
              <div style={{ height:240, marginBottom:24 }}>
                <RichTextEditor name="tdesc" value={formData.tdesc} onChange={v => setFormData(p=>({...p, tdesc:v}))} />
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>setShowForm(false)} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", background:"#f1f5f9", color:"#475569", fontWeight:500, cursor:"pointer", fontSize:12 }}>Cancel</button>
                <button type="submit" style={{ flex:2, padding:"8px 0", borderRadius:8, border:"none", background:"#0f172a", color:"#fff", fontWeight:500, cursor:"pointer", fontSize:12 }}>Add Task</button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* Floating chat windows */}
      <div className="flex flex-row-reverse items-end fixed right-20 bottom-0">
        {activeChatTasks.map(taskId => {
          const t = tasks.find(task => task._id === taskId);
          return (
            <AdminempChat
              key={taskId}
              taskid={t?._id || ''}
              emid={t?.taptr || t?.empId || t?.employeeId || ''}
              dp={t?.apdp || ''}
              name={t?.apname || 'Unknown'}
              tname={t?.tname || ''}
              tdesc={t?.tdesc || ''}
              isVisible={chatVisibility[taskId]}
              onClose={() => closeChat(taskId)}
              onToggle={() => toggleChatVisibility(taskId)}
            />
          );
        })}
      </div>
    </>
  );
};

export default WorkDis;