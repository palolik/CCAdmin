/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MdAdd, MdEdit, MdContentCopy, MdDeleteOutline, MdExpandMore, MdChevronRight } from "react-icons/md";
import { base_url } from "../../config/config";
import { ShimmerGrid } from "../../userside/utils/Shimmer";

const stepTotals = (flow) => (flow.flow || []).reduce(
  (acc, s) => ({ hours: acc.hours + (Number(s.ttime) || 0), cc: acc.cc + (Number(s.tcc) || 0) }),
  { hours: 0, cc: 0 }
);

// ── One flow template ─────────────────────────────────────────
const FlowCard = ({ flow, packageName, open, onToggle, onEdit, onDuplicate, onDelete }) => {
  const steps = flow.flow || [];
  const totals = stepTotals(flow);
  const iconBtn = "p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-800 truncate">{flow.title || "Untitled flow"}</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {packageName
                ? <>Package: <span className="font-medium text-gray-700">{packageName}</span></>
                : <span className="text-amber-600">Package not found ({flow.packageId || "none"})</span>}
            </p>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button title="Edit" onClick={onEdit} className={iconBtn}><MdEdit size={17} /></button>
            <button title="Duplicate" onClick={onDuplicate} className={iconBtn}><MdContentCopy size={16} /></button>
            <button title="Delete" onClick={onDelete} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><MdDeleteOutline size={18} /></button>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">⏱ {totals.hours}h</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">💰 {totals.cc} CC</span>
        </div>

        {/* step chain */}
        {steps.length > 0 && (
          <div className="flex items-center flex-wrap gap-1 mt-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full pl-1 pr-2.5 py-0.5 max-w-[180px]">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="truncate text-gray-700">{s.tname || "Untitled"}</span>
                </span>
                {i < steps.length - 1 && <MdChevronRight className="text-gray-300" size={16} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {steps.length > 0 && (
        <button onClick={onToggle} className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border-t border-gray-100 hover:bg-gray-100 transition">
          {open ? "Hide steps" : "Show steps"} <MdExpandMore size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}

      {open && (
        <div className="px-5 py-4 border-t border-gray-100 bg-slate-50/60">
          <ol className="relative space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="relative pl-9">
                {i < steps.length - 1 && <div className="absolute left-[11px] top-7 bottom-[-16px] w-0.5 bg-indigo-100" />}
                <span className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                <p className="text-sm font-semibold text-gray-800">{s.tname || "Untitled step"}</p>
                <div className="flex flex-wrap gap-1.5 mt-1 text-[11px]">
                  {s.rdep && <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{s.rdep}{s.rsubdep ? ` · ${s.rsubdep}` : ""}{s.esprts ? ` · ${s.esprts}` : ""}</span>}
                  <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">⏱ {Number(s.ttime) || 0}h</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">💰 {Number(s.tcc) || 0} CC</span>
                </div>
                {s.tdesc && (
                  <div
                    className="prose prose-sm max-w-none mt-2 text-gray-600 bg-white border border-gray-100 rounded-lg px-3 py-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: s.tdesc }}
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

const Allflows = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${base_url}/taskflows`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`${base_url}/packages`).then(r => r.json()).catch(() => []),
    ])
      .then(([flowData, packageData]) => {
        setFlows(Array.isArray(flowData) ? flowData : []);
        setPackages(Array.isArray(packageData) ? packageData : []);
      })
      .catch(() => Swal.fire("Error", "Unable to load flow templates.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const packageNameOf = (flow) => packages.find(p => p._id === flow.packageId)?.packageName || flow.packageName || "";

  const handleDelete = async (flow) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete this flow?",
      text: `"${flow.title}" — new orders for its package won't get tasks automatically.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delete",
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`${base_url}/taskflows/${flow._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.deletedCount) throw new Error();
      setFlows(prev => prev.filter(f => f._id !== flow._id));
    } catch {
      Swal.fire("Error", "Could not delete the flow.", "error");
    }
  };

  const q = search.trim().toLowerCase();
  const visible = q
    ? flows.filter(f => [f.title, packageNameOf(f), ...(f.flow || []).map(s => s.tname)].some(v => (v || "").toLowerCase().includes(q)))
    : flows;

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      <div className="hdr">All Work Flows</div>

      <div className="p-6">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search flows, packages, steps…"
            className="w-72 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
          />
          <button onClick={() => navigate("/admin/flowmaker")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-900 text-white text-[13px] font-medium hover:bg-ink-700 transition">
            <MdAdd size={18} /> New flow
          </button>
        </div>

        {loading && <ShimmerGrid count={4} cols="grid-cols-1 lg:grid-cols-2" gap="gap-4" card={{ image: false, lines: 4 }} />}

        {!loading && flows.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-600 font-medium">No work flows yet</p>
            <p className="text-sm text-gray-400 mt-1">A flow creates a package&apos;s tasks automatically once its order is paid.</p>
            <button onClick={() => navigate("/admin/flowmaker")} className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-900 text-white text-[13px] font-medium hover:bg-ink-700 transition">
              <MdAdd size={18} /> Create the first flow
            </button>
          </div>
        )}

        {!loading && flows.length > 0 && visible.length === 0 && (
          <p className="text-sm text-gray-400">No flows match “{search}”.</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {visible.map(flow => (
            <FlowCard
              key={flow._id}
              flow={flow}
              packageName={packageNameOf(flow)}
              open={openId === flow._id}
              onToggle={() => setOpenId(o => (o === flow._id ? null : flow._id))}
              onEdit={() => navigate(`/admin/flowmaker?id=${flow._id}`)}
              onDuplicate={() => navigate(`/admin/flowmaker?duplicate=${flow._id}`)}
              onDelete={() => handleDelete(flow)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Allflows;
