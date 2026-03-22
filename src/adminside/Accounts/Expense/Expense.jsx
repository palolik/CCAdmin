import * as XLSX from "xlsx";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { base_url } from "../../../config/config";

const CATEGORIES = ["Food","Transport","Utilities","Marketing","Office","Salary","Software","Other"];
const emptyForm  = { title:"", amount:"", category:"Other", date:"", note:"" };

// ── shared inline style objects ──────────────────────────────────────────────
const lbl = {
  display:"block", fontSize:11, color:"#94a3b8",
  marginBottom:4, fontWeight:500, letterSpacing:"0.03em",
};
const inp = {
  width:"100%", border:"1px solid #e2e5ee", borderRadius:8,
  padding:"9px 12px", fontSize:13.5, fontFamily:"inherit",
  background:"#fafbfd", outline:"none", boxSizing:"border-box",
  color:"#1e293b",
};

const catColors = {
  Food:"#ea580c",Transport:"#0284c7",Utilities:"#0d9488",
  Marketing:"#9333ea",Office:"#4338ca",Salary:"#16a34a",
  Software:"#2563eb",Other:"#64748b",
};

// ─────────────────────────────────────────────────────────────────────────────
const Expense = () => {
  const [expenses,   setExpenses]   = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(emptyForm);
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState("");
  const [filterCat,  setFilterCat]  = useState("All");

  // ── load ──────────────────────────────────────────────────────────────────
  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${base_url}/expense`);
      const data = await res.json();
      setExpenses(data.sort((a,b) => new Date(b.date) - new Date(a.date)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadExpenses(); }, []);

  // ── derived ───────────────────────────────────────────────────────────────
  const total    = expenses.reduce((s,e) => s + Number(e.amount||0), 0);
  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    return (e.title?.toLowerCase().includes(q) || e.note?.toLowerCase().includes(q))
        && (filterCat === "All" || e.category === filterCat);
  });

  // ── modal helpers ─────────────────────────────────────────────────────────
  const openAdd  = ()    => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (exp) => {
    setEditing(exp);
    setForm({ title:exp.title||"", amount:exp.amount||"", category:exp.category||"Other",
              date:exp.date?exp.date.slice(0,10):"", note:exp.note||"" });
    setShowForm(true);
  };
  const closeModal = () => { setShowForm(false); setEditing(null); };
  const onChange   = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim() || !form.amount) {
      Swal.fire("Validation","Title and Amount are required.","warning"); return;
    }
    try {
      setSaving(true);
      const payload = { ...form, amount: parseFloat(form.amount)||0 };
      if (editing) {
        const res  = await fetch(`${base_url}/expense/${editing._id}`,
          { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) {
          setExpenses(p => p.map(e => e._id===editing._id ? {...e,...payload} : e));
          Swal.fire("Updated!","Expense updated.","success");
          closeModal();
        } else { Swal.fire("Error", data.message||"Update failed","error"); }
      } else {
        const res  = await fetch(`${base_url}/addexpense`,
          { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
        const data = await res.json();
        if (data.insertedId) {
          setExpenses(p => [{ ...payload, _id:data.insertedId }, ...p]);
          Swal.fire("Added!","Expense added.","success");
          closeModal();
        } else { Swal.fire("Error","Failed to add expense.","error"); }
      }
    } catch { Swal.fire("Error","Unexpected error.","error"); }
    finally { setSaving(false); }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    Swal.fire({ title:"Delete expense?", text:"This cannot be undone.", icon:"warning",
      showCancelButton:true, confirmButtonColor:"#ef4444", confirmButtonText:"Delete" })
    .then(async ({ isConfirmed }) => {
      if (!isConfirmed) return;
      const res  = await fetch(`${base_url}/delexpense/${id}`, { method:"DELETE" });
      const data = await res.json();
      if (data.success) { setExpenses(p => p.filter(e => e._id!==id)); Swal.fire("Deleted!","","success"); }
      else Swal.fire("Error", data.message||"Delete failed","error");
    });
  };

  // ── export ────────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (!expenses.length) { Swal.fire("No data","Nothing to export.","info"); return; }
    const rows = expenses.map(e => ({
      Title:e.title, Category:e.category,
      Amount:Number(e.amount).toFixed(2),
      Date:e.date?new Date(e.date).toLocaleDateString():"",
      Note:e.note||"",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses.xlsx");
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700&display=swap');
        .exp-syne { font-family:'Syne',sans-serif; }
        .exp-sans { font-family:'DM Sans',sans-serif; }
        .exp-stat { background:#fff; border:1px solid #e8eaf0; border-radius:14px; padding:18px 22px; transition:box-shadow .2s; }
        .exp-stat:hover { box-shadow:0 4px 20px rgba(0,0,0,.07); }
        .exp-card { background:#fff; border:1px solid #e8eaf0; border-radius:14px; overflow:hidden; }
        .exp-row  { border-bottom:1px solid #f0f2f7; transition:background .15s; }
        .exp-row:hover { background:#fafbfd; }
        .exp-row:last-child { border-bottom:none; }
        .exp-chip { padding:5px 14px; border-radius:999px; font-size:12.5px; font-weight:500; border:1.5px solid #e2e5ee; background:#fff; color:#64748b; cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif; }
        .exp-chip:hover,.exp-chip.on { border-color:#1e293b; background:#1e293b; color:#fff; }
        .exp-search { border:1px solid #e2e5ee; border-radius:9px; padding:8px 14px; font-size:13px; font-family:'DM Sans',sans-serif; background:#fafbfd; outline:none; width:220px; }
        .exp-search:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
      `}</style>

      <div className="exp-sans w-full" style={{ background:"#f7f8fb", minHeight:"100vh" }}>

        {/* header */}
        <div className="w-full">
      <div className="hdr">Expense Record</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={exportToExcel}
              style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"#f1f3f8", color:"#475569", fontWeight:500, cursor:"pointer", fontSize:13 }}>
              ↓ Export
            </button>
            <button onClick={openAdd}
              style={{ padding:"9px 20px", borderRadius:9, border:"none", background:"#1e293b", color:"#fff", fontWeight:600, cursor:"pointer", fontSize:13 }}>
              + Add Expense
            </button>
          </div>
        </div>

        <div style={{ padding:"0 28px 28px" }}>

          {/* stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
            {[
              { label:"Total Spent",   value:`${total.toFixed(2)} BDT` },
              { label:"Entries",       value:expenses.length },
              { label:"Avg per Entry", value:`${expenses.length?(total/expenses.length).toFixed(2):"0.00"} BDT` },
            ].map(s => (
              <div key={s.label} className="exp-stat">
                <p style={{ margin:"0 0 4px", fontSize:11, color:"#94a3b8", fontWeight:500 }}>{s.label}</p>
                <p className="exp-syne" style={{ margin:0, fontSize:20, color:"#1e293b", fontWeight:700 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* filters */}
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:10, marginBottom:20 }}>
            <input className="exp-search" placeholder="Search title or note…" value={search} onChange={e=>setSearch(e.target.value)} />
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {["All",...CATEGORIES].map(c => (
                <button key={c} className={`exp-chip ${filterCat===c?"on":""}`} onClick={()=>setFilterCat(c)}>{c}</button>
              ))}
            </div>
          </div>

          {/* table */}
          <div className="exp-card">
            {loading ? (
              <div style={{ padding:"56px 0", textAlign:"center", color:"#94a3b8", fontSize:14 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:"56px 0", textAlign:"center", color:"#94a3b8", fontSize:14 }}>No expenses found.</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #f0f2f7" }}>
                    {["Title","Category","Amount","Date","Note",""].map(h => (
                      <th key={h} style={{ textAlign:"left", padding:"12px 18px", fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:"0.07em", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(exp => (
                    <tr key={exp._id} className="exp-row">
                      <td style={{ padding:"12px 18px", fontWeight:500, color:"#334155" }}>{exp.title}</td>
                      <td style={{ padding:"12px 18px" }}>
                        <span style={{ display:"inline-block", fontSize:11.5, fontWeight:600, padding:"2px 10px", borderRadius:999,
                          background:catColors[exp.category]+"18", color:catColors[exp.category]||"#64748b" }}>
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ padding:"12px 18px", fontWeight:600, color:"#16a34a" }}>{Number(exp.amount).toFixed(2)}</td>
                      <td style={{ padding:"12px 18px", fontSize:12, color:"#94a3b8" }}>
                        {exp.date ? new Date(exp.date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "—"}
                      </td>
                      <td style={{ padding:"12px 18px", fontSize:12, color:"#94a3b8", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{exp.note||"—"}</td>
                      <td style={{ padding:"12px 18px" }}>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={()=>openEdit(exp)}
                            style={{ padding:"5px 14px", borderRadius:7, border:"none", background:"#f1f5f9", color:"#475569", fontWeight:500, cursor:"pointer", fontSize:12 }}>
                            Edit
                          </button>
                          <button onClick={()=>handleDelete(exp._id)}
                            style={{ padding:"5px 14px", borderRadius:7, border:"none", background:"#fef2f2", color:"#ef4444", fontWeight:500, cursor:"pointer", fontSize:12 }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Portal ── */}
      {showForm && createPortal(
        <div
          onClick={e => e.target===e.currentTarget && closeModal()}
          style={{
            position:"fixed", top:0, left:0, right:0, bottom:0,
            background:"rgba(15,23,42,.55)",
            backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:99999,
          }}
        >
          <div style={{
            background:"#fff", borderRadius:18, padding:32,
            width:"calc(100% - 32px)", maxWidth:440,
            boxShadow:"0 24px 60px rgba(0,0,0,.22)",
            fontFamily:"'DM Sans',sans-serif",
          }}>
            {/* modal header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
              <h2 className="exp-syne" style={{ margin:0, fontSize:18, fontWeight:700, color:"#1e293b" }}>
                {editing ? "Edit Expense" : "New Expense"}
              </h2>
              <button onClick={closeModal}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#94a3b8", lineHeight:1, padding:0 }}>✕</button>
            </div>

            {/* fields */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={lbl}>Title *</label>
                <input name="title" style={inp} placeholder="e.g. Office supplies" value={form.title} onChange={onChange} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={lbl}>Amount (BDT) *</label>
                  <input name="amount" type="number" min="0" step="0.01" style={inp} placeholder="0.00" value={form.amount} onChange={onChange} />
                </div>
                <div>
                  <label style={lbl}>Date</label>
                  <input name="date" type="date" style={inp} value={form.date} onChange={onChange} />
                </div>
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select name="category" style={inp} value={form.category} onChange={onChange}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Note</label>
                <textarea name="note" rows={3} style={{ ...inp, resize:"none" }} placeholder="Optional…" value={form.note} onChange={onChange} />
              </div>
            </div>

            {/* modal actions */}
            <div style={{ display:"flex", gap:10, marginTop:24 }}>
              <button onClick={closeModal}
                style={{ flex:1, padding:"10px 0", borderRadius:9, border:"none", background:"#f1f3f8", color:"#475569", fontWeight:500, cursor:"pointer", fontSize:13 }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:2, padding:"10px 0", borderRadius:9, border:"none", background:saving?"#94a3b8":"#1e293b", color:"#fff", fontWeight:600, cursor:saving?"not-allowed":"pointer", fontSize:13 }}>
                {saving ? "Saving…" : editing ? "Update" : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
};

export default Expense;