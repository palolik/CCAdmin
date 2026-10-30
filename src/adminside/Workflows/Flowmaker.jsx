/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  MdAdd, MdArrowUpward, MdArrowDownward, MdContentCopy, MdDeleteOutline,
  MdExpandMore, MdAccessTime, MdCheckCircle, MdErrorOutline,
} from "react-icons/md";
import RichTextEditor from '../../userside/utils/PichTextEditor';
import { base_url } from "../../config/config";
import { departmentData, subdepartmentData } from "../workdis/departments";

// A flow is a template of ordered tasks for one package. When an order for
// that package is paid, the server creates the tasks: step 1 opens for
// employees and each later step activates when the previous one is approved.

const emptyStep = () => ({ tname: "", tdesc: "", rdep: "", rsubdep: "", esprts: "", ttime: "", tcc: "" });
const withOrder = (steps) => steps.map((s, i) => ({ ...s, order: i + 1 }));

const stepProblems = (step) => [
  !String(step.tname || "").trim() && "name",
  !step.rdep && "department",
  !step.rsubdep && "sub department",
  !(Number(step.ttime) > 0) && "hours",
].filter(Boolean);

const input = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition";
const label = "block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1";

// Keeps a saved value selectable even if it isn't in the preset lists.
const withCurrent = (options, current) => (current && !options.includes(current) ? [current, ...options] : options);

// ── One step on the timeline ──────────────────────────────────
const StepCard = ({ step, index, count, open, onToggle, onChange, onMove, onDuplicate, onRemove }) => {
  const problems = stepProblems(step);
  const subDepartments = withCurrent(departmentData.find(d => d.department === step.rdep)?.subDepartments || [], step.rsubdep);
  const expertise = withCurrent(subdepartmentData[step.rsubdep] || [], step.esprts);
  const iconBtn = "p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition";

  return (
    <div className="relative pl-12">
      {/* timeline rail + number */}
      {index < count - 1 && <div className="absolute left-[17px] top-10 bottom-[-16px] w-0.5 bg-indigo-100" />}
      <div className={`absolute left-0 top-3 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
        problems.length ? "bg-white border-amber-300 text-amber-600" : "bg-indigo-600 border-indigo-600 text-white"
      }`}>
        {index + 1}
      </div>

      <div className={`bg-white rounded-xl border shadow-sm transition ${open ? "border-indigo-200 shadow-md" : "border-gray-200"}`}>
        {/* header */}
        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${step.tname ? "text-gray-800" : "text-gray-400 italic"}`}>
              {step.tname || "Untitled step"}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px]">
              {step.rdep
                ? <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{step.rdep}{step.rsubdep ? ` · ${step.rsubdep}` : ""}{step.esprts ? ` · ${step.esprts}` : ""}</span>
                : <span className="text-gray-400">No department</span>}
              {Number(step.ttime) > 0 && <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">⏱ {step.ttime}h</span>}
              {Number(step.tcc) > 0 && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">💰 {step.tcc} CC</span>}
              {problems.length > 0 && <span className="text-amber-600">Needs {problems.join(", ")}</span>}
            </div>
          </div>
          <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
            <button type="button" title="Move up" disabled={index === 0} onClick={() => onMove(-1)} className={iconBtn}><MdArrowUpward size={16} /></button>
            <button type="button" title="Move down" disabled={index === count - 1} onClick={() => onMove(1)} className={iconBtn}><MdArrowDownward size={16} /></button>
            <button type="button" title="Duplicate" onClick={onDuplicate} className={iconBtn}><MdContentCopy size={15} /></button>
            <button type="button" title="Remove" onClick={onRemove} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><MdDeleteOutline size={17} /></button>
            <span className={`ml-1 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}><MdExpandMore size={20} /></span>
          </div>
        </div>

        {/* body */}
        {open && (
          <div className="border-t border-gray-100 px-4 py-4 space-y-4">
            <div>
              <span className={label}>Step name</span>
              <input
                autoFocus={!step.tname}
                value={step.tname}
                onChange={e => onChange({ tname: e.target.value })}
                placeholder="e.g. Design the homepage"
                className={input}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className={label}>Department</span>
                <select value={step.rdep} onChange={e => onChange({ rdep: e.target.value, rsubdep: "", esprts: "" })} className={input}>
                  <option value="">Select</option>
                  {withCurrent(departmentData.map(d => d.department), step.rdep).map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <span className={label}>Sub department</span>
                <select value={step.rsubdep} disabled={!step.rdep} onChange={e => onChange({ rsubdep: e.target.value, esprts: "" })} className={`${input} disabled:opacity-50`}>
                  <option value="">Select</option>
                  {subDepartments.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <span className={label}>Expertise</span>
                <select value={step.esprts} disabled={!step.rsubdep} onChange={e => onChange({ esprts: e.target.value })} className={`${input} disabled:opacity-50`}>
                  <option value="">Any</option>
                  {expertise.map(x => <option key={x}>{x}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:max-w-sm">
              <div>
                <span className={label}>Time (hours)</span>
                <input type="number" min={0} value={step.ttime} onChange={e => onChange({ ttime: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="8" className={input} />
              </div>
              <div>
                <span className={label}>Allocated CC</span>
                <input type="number" min={0} value={step.tcc} onChange={e => onChange({ tcc: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="50" className={input} />
              </div>
            </div>

            <div>
              <span className={label}>Description</span>
              <div className="h-[200px] mb-12">
                <RichTextEditor name="tdesc" value={step.tdesc} onChange={v => onChange({ tdesc: v === "<p><br></p>" ? "" : v })} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function FlowMaker() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const duplicateId = searchParams.get("duplicate");

  const [title, setTitle] = useState("");
  const [packageId, setPackageId] = useState("");
  const [steps, setSteps] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [packages, setPackages] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(Boolean(editId || duplicateId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${base_url}/packages`).then(r => r.json()).then(d => setPackages(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${base_url}/taskflows`).then(r => r.json()).then(d => setFlows(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Load the flow being edited (or copied).
  useEffect(() => {
    const sourceId = editId || duplicateId;
    if (!sourceId) {
      // Sidebar link while editing: start a fresh flow.
      setTitle(""); setPackageId(""); setSteps([]); setOpenIndex(null);
      return;
    }
    setLoading(true);
    fetch(`${base_url}/taskflows/${sourceId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(flow => {
        setTitle(duplicateId ? `${flow.title} (copy)` : flow.title || "");
        setPackageId(duplicateId ? "" : flow.packageId || "");
        setSteps(withOrder((flow.flow || []).map(s => ({ ...emptyStep(), ...s }))));
      })
      .catch(() => Swal.fire("Error", "Could not load that flow.", "error"))
      .finally(() => setLoading(false));
  }, [editId, duplicateId]);

  const updateStep = (index, patch) => setSteps(prev => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addStep = () => {
    setSteps(prev => withOrder([...prev, emptyStep()]));
    setOpenIndex(steps.length);
  };

  const moveStep = (index, delta) => {
    const to = index + delta;
    if (to < 0 || to >= steps.length) return;
    setSteps(prev => {
      const arr = [...prev];
      const [item] = arr.splice(index, 1);
      arr.splice(to, 0, item);
      return withOrder(arr);
    });
    setOpenIndex(o => (o === index ? to : o === to ? index : o));
  };

  const duplicateStep = (index) => {
    setSteps(prev => withOrder([...prev.slice(0, index + 1), { ...prev[index] }, ...prev.slice(index + 1)]));
    setOpenIndex(index + 1);
  };

  const removeStep = async (index) => {
    const step = steps[index];
    if (step.tname || step.tdesc) {
      const { isConfirmed } = await Swal.fire({ title: "Remove this step?", text: step.tname || "Untitled step", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Remove" });
      if (!isConfirmed) return;
    }
    setSteps(prev => withOrder(prev.filter((_, i) => i !== index)));
    setOpenIndex(o => (o === index ? null : o > index ? o - 1 : o));
  };

  const totals = steps.reduce((acc, s) => ({ hours: acc.hours + (Number(s.ttime) || 0), cc: acc.cc + (Number(s.tcc) || 0) }), { hours: 0, cc: 0 });
  const selectedPackage = packages.find(p => p._id === packageId);
  // The server uses one flow per package; warn before making a second.
  const clash = packageId && flows.find(f => f.packageId === packageId && f._id !== editId);

  const problems = [
    !title.trim() && "Add a template title",
    !packageId && "Choose a package",
    clash && `"${clash.title}" already uses this package`,
    steps.length === 0 && "Add at least one step",
    ...steps.map((s, i) => {
      const missing = stepProblems(s);
      return missing.length ? `Step ${i + 1}: needs ${missing.join(", ")}` : null;
    }),
  ].filter(Boolean);

  const save = async (e) => {
    e.preventDefault();
    if (problems.length) {
      Swal.fire({ icon: "warning", title: "Almost there", html: problems.map(p => `• ${p}`).join("<br/>") });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(editId ? `${base_url}/taskflows/${editId}` : `${base_url}/taskflows`, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), packageId, packageName: selectedPackage?.packageName || "", flow: withOrder(steps) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !(data.insertedId || data.acknowledged)) throw new Error();
      await Swal.fire({ icon: "success", title: editId ? "Flow updated" : "Flow created", timer: 1200, showConfirmButton: false });
      navigate("/admin/allflows");
    } catch {
      Swal.fire("Error", "Could not save the flow.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="hdr">{editId ? "Edit Work Flow" : "Work Flow Maker"}</div>
        <div className="p-8 text-sm text-gray-400">Loading flow…</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      <div className="hdr">{editId ? "Edit Work Flow" : "Work Flow Maker"}</div>

      <form onSubmit={save} className="p-6 flex flex-col xl:flex-row gap-6 items-start">
        {/* Builder */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className={label}>Template title</span>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Website — standard delivery" className={input} />
            </div>
            <div>
              <span className={label}>Package</span>
              <select value={packageId} onChange={e => setPackageId(e.target.value)} className={input}>
                <option value="">Select a package</option>
                {packages.map(p => <option key={p._id} value={p._id}>{p.packageName || p._id}</option>)}
                {packageId && !selectedPackage && <option value={packageId}>{packageId}</option>}
              </select>
              {clash && <p className="mt-1 text-xs text-amber-600">“{clash.title}” already uses this package. Only one flow runs per package.</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Steps <span className="text-gray-400 font-normal">({steps.length})</span></h3>
              <p className="text-xs text-gray-400 hidden md:block">Step 1 opens when the order is paid; each next step opens when the previous one is approved.</p>
            </div>

            {steps.length === 0 ? (
              <button type="button" onClick={addStep} className="w-full py-10 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-ink-900 hover:bg-ink-200/40 transition flex flex-col items-center gap-1">
                <MdAdd size={28} />
                <span className="text-sm font-medium">Add the first step</span>
              </button>
            ) : (
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <StepCard
                    key={i}
                    step={step}
                    index={i}
                    count={steps.length}
                    open={openIndex === i}
                    onToggle={() => setOpenIndex(o => (o === i ? null : i))}
                    onChange={patch => updateStep(i, patch)}
                    onMove={delta => moveStep(i, delta)}
                    onDuplicate={() => duplicateStep(i)}
                    onRemove={() => removeStep(i)}
                  />
                ))}
                <div className="pl-12">
                  <button type="button" onClick={addStep} className="w-full py-1.5 rounded-lg border-2 border-dashed border-gray-300 text-[13px] font-medium text-gray-500 hover:border-indigo-400 hover:text-ink-900 hover:bg-ink-200/40 transition flex items-center justify-center gap-1">
                    <MdAdd size={18} /> Add step
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="w-full xl:w-[320px] flex-shrink-0 xl:sticky xl:top-4 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Summary</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-indigo-50 py-3">
                <p className="text-xl font-bold text-indigo-700">{steps.length}</p>
                <p className="text-[11px] text-indigo-500">steps</p>
              </div>
              <div className="rounded-lg bg-green-50 py-3">
                <p className="text-xl font-bold text-green-700">{totals.hours}</p>
                <p className="text-[11px] text-green-600">hours</p>
              </div>
              <div className="rounded-lg bg-blue-50 py-3">
                <p className="text-xl font-bold text-blue-700">{totals.cc}</p>
                <p className="text-[11px] text-blue-600">CC</p>
              </div>
            </div>
            {selectedPackage && (
              <p className="mt-3 text-xs text-gray-500 flex items-center gap-1"><MdAccessTime size={14} /> Runs for <span className="font-semibold text-gray-700">{selectedPackage.packageName}</span></p>
            )}

            <div className="mt-4 border-t border-gray-100 pt-3">
              {problems.length === 0 ? (
                <p className="flex items-center gap-1.5 text-sm text-green-700"><MdCheckCircle size={18} /> Ready to save</p>
              ) : (
                <ul className="space-y-1.5">
                  {problems.slice(0, 6).map(p => (
                    <li key={p} className="flex items-start gap-1.5 text-xs text-amber-700"><MdErrorOutline size={15} className="flex-shrink-0 mt-px" /> {p}</li>
                  ))}
                  {problems.length > 6 && <li className="text-xs text-amber-700 pl-5">+{problems.length - 6} more</li>}
                </ul>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => navigate("/admin/allflows")} className="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[13px] font-medium hover:bg-gray-200 transition">Cancel</button>
              <button type="submit" disabled={saving} className="flex-[2] py-1.5 rounded-lg bg-ink-900 text-white text-[13px] font-medium hover:bg-ink-700 disabled:opacity-50 transition">
                {saving ? "Saving…" : editId ? "Save changes" : "Create flow"}
              </button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
