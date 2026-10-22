import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { base_url } from "../../config/config";
import { Shimmer, ShimmerStats, ShimmerTable } from "../../userside/utils/Shimmer";

// ── Palette ───────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:    "#f97316",
  Accepted:   "#3b82f6",
  VerifyTask: "#a855f7",
  Completed:  "#22c55e",
  Done:       "#10b981",
};

const BAR_COLORS = ["#3b82f6","#a855f7","#f97316","#22c55e","#ef4444","#06b6d4","#f59e0b"];

// ── Small helpers ─────────────────────────────────────────────
const fmt = (ds) => {
  if (!ds || ds === "NA") return "—";
  const d = new Date(ds);
  return isNaN(d) ? "—" : d.toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit", hour12:true });
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
    {children}
  </div>
);

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
      style={{ background: color + "18" }}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800" style={{ color }}>{value}</p>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{children}</p>
);

// ── Custom tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${base_url}/alltasks`)
      .then(r => r.json())
      .then(data => { setTasks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full min-h-screen bg-[#f7f8fb]">
      <div className="hdr">Task Analytics Dashboard</div>
      <div className="p-6 space-y-6">
        <ShimmerStats count={4} />
        {[0, 1, 2].map(r => (
          <div key={r} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[0, 1].map(c => (
              <Card key={c}>
                <Shimmer className="h-4 w-40 max-w-full rounded mb-4" />
                <Shimmer className="w-full h-[220px] rounded-lg" />
              </Card>
            ))}
          </div>
        ))}
        <ShimmerTable rows={6} cols={8} />
      </div>
    </div>
  );

  if (!tasks.length) return (
    <div className="flex items-center justify-center h-[80vh] text-gray-400 text-sm">
      No task data available.
    </div>
  );

  // ── Derived data ────────────────────────────────────────────

  // 1. Status distribution
  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.tstatus] = (acc[t.tstatus] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // 2. Tasks by department
  const depCounts = tasks.reduce((acc, t) => {
    if (t.rdep) acc[t.rdep] = (acc[t.rdep] || 0) + 1;
    return acc;
  }, {});
  const depData = Object.entries(depCounts).map(([name, count]) => ({ name: name.replace(" Development","").replace(" & ","&"), count }));

  // 3. Tasks by sub-department
  const subDepCounts = tasks.reduce((acc, t) => {
    if (t.rsubdep) acc[t.rsubdep] = (acc[t.rsubdep] || 0) + 1;
    return acc;
  }, {});
  const subDepData = Object.entries(subDepCounts).map(([name, count]) => ({ name, count }));

  // 4. Time allocation per task
  const timeData = tasks.map(t => ({
    name: t.tname?.length > 16 ? t.tname.slice(0, 16) + "…" : t.tname,
    hours: parseFloat(t.ttime) || 0,
    cc: parseFloat(t.tcc) || 0,
  }));

  // 5. CC allocation per task
  const ccData = [...timeData].sort((a, b) => b.cc - a.cc);

  // 6. Timeline — tasks created per day
  const timelineCounts = tasks.reduce((acc, t) => {
    if (!t.tmt || t.tmt === "NA") return acc;
    const day = new Date(t.tmt).toLocaleDateString("en-US", { month:"short", day:"numeric" });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const timelineData = Object.entries(timelineCounts)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([date, count]) => ({ date, count }));

  // 7. Alert flags
  const timedOutTasks  = tasks.filter(t => t.timeranout);
  const moreTimeTasks  = tasks.filter(t => t.tmoretime && t.tmoretime !== false);
  const unassignedTasks= tasks.filter(t => !t.apname || t.taptr === "NA");
  const totalHours     = tasks.reduce((s, t) => s + (parseFloat(t.ttime) || 0), 0);
  const totalCC        = tasks.reduce((s, t) => s + (parseFloat(t.tcc) || 0), 0);
  const completionRate = tasks.length ? Math.round((tasks.filter(t => t.tstatus === "Done" || t.tstatus === "Completed").length / tasks.length) * 100) : 0;

  // 8. Employee workload
  const empLoad = tasks.reduce((acc, t) => {
    if (t.apname && t.taptr !== "NA") {
      if (!acc[t.apname]) acc[t.apname] = { name: t.apname, tasks: 0, hours: 0, cc: 0 };
      acc[t.apname].tasks++;
      acc[t.apname].hours += parseFloat(t.ttime) || 0;
      acc[t.apname].cc    += parseFloat(t.tcc)   || 0;
    }
    return acc;
  }, {});
  const empData = Object.values(empLoad);

  return (
    <div className="w-full min-h-screen bg-[#f7f8fb]">
      <div className="hdr">Task Analytics Dashboard</div>

      <div className="p-6 space-y-6">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tasks"      value={tasks.length}       color="#3b82f6" icon="📋" />
          <StatCard label="Completion Rate"  value={completionRate+"%"} color="#22c55e" icon="✅" sub={`${tasks.filter(t=>t.tstatus==="Done"||t.tstatus==="Completed").length} of ${tasks.length} done`} />
          <StatCard label="Total Hours"      value={totalHours+"h"}     color="#a855f7" icon="⏱"  sub="Across all tasks" />
          <StatCard label="Total CC Budget"  value={totalCC+" CC"}      color="#f97316" icon="💰" sub="Cloud Credits allocated" />
        </div>

        {/* ── Alert Row ── */}
        {(timedOutTasks.length > 0 || moreTimeTasks.length > 0 || unassignedTasks.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {timedOutTasks.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-bold text-red-700 text-sm">Time Ran Out</p>
                  <p className="text-red-500 text-xs mt-0.5">{timedOutTasks.length} task{timedOutTasks.length>1?"s":""} exceeded deadline</p>
                  <div className="mt-2 space-y-1">
                    {timedOutTasks.map(t => (
                      <p key={t._id} className="text-xs text-red-600 font-medium">• {t.tname}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {moreTimeTasks.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">🕐</span>
                <div>
                  <p className="font-bold text-amber-700 text-sm">Extra Time Requested</p>
                  <p className="text-amber-500 text-xs mt-0.5">{moreTimeTasks.length} task{moreTimeTasks.length>1?"s":""} need more time</p>
                  <div className="mt-2 space-y-1">
                    {moreTimeTasks.map(t => (
                      <p key={t._id} className="text-xs text-amber-600 font-medium">• {t.tname}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {unassignedTasks.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="font-bold text-blue-700 text-sm">Unassigned Tasks</p>
                  <p className="text-blue-500 text-xs mt-0.5">{unassignedTasks.length} task{unassignedTasks.length>1?"s":""} waiting for assignment</p>
                  <div className="mt-2 space-y-1">
                    {unassignedTasks.map(t => (
                      <p key={t._id} className="text-xs text-blue-600 font-medium">• {t.tname}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Row 1: Status + Department ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Status Donut */}
          <Card>
            <SectionTitle>Task Status Distribution</SectionTitle>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: STATUS_COLORS[s.name] || BAR_COLORS[i] }} />
                      <span className="text-xs text-gray-600 font-medium">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Department Bar */}
          <Card>
            <SectionTitle>Tasks by Department</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={depData} margin={{ top:5, right:10, left:-20, bottom:5 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"#f3f4f6" }} />
                <Bar dataKey="count" name="Tasks" radius={[6,6,0,0]}>
                  {depData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── Row 2: Hours + CC ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Hours per task */}
          <Card>
            <SectionTitle>Hours Allocated per Task</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={timeData} margin={{ top:5, right:10, left:-20, bottom:40 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:10, fill:"#9ca3af" }} angle={-30} textAnchor="end"
                  axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} unit="h" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"#f3f4f6" }} />
                <Bar dataKey="hours" name="Hours" radius={[6,6,0,0]}>
                  {timeData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* CC per task */}
          <Card>
            <SectionTitle>CC Budget per Task (Ranked)</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ccData} layout="vertical" margin={{ top:5, right:30, left:10, bottom:5 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"#f3f4f6" }} />
                <Bar dataKey="cc" name="CC" radius={[0,6,6,0]}>
                  {ccData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── Row 3: Timeline + Employee Load ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Task creation timeline */}
          <Card>
            <SectionTitle>Task Creation Timeline</SectionTitle>
            {timelineData.length < 2 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Not enough data for a timeline yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timelineData} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                  <defs>
                    <linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="Tasks Created" stroke="#3b82f6" strokeWidth={2.5}
                    fill="url(#tlGrad)" dot={{ r:4, fill:"#3b82f6", strokeWidth:0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Employee workload */}
          <Card>
            <SectionTitle>Employee Workload</SectionTitle>
            {empData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                No assigned tasks yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={empData} margin={{ top:5, right:10, left:-20, bottom:5 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:"#f3f4f6" }} />
                  <Legend wrapperStyle={{ fontSize:11, color:"#9ca3af" }} />
                  <Bar dataKey="tasks" name="Tasks" fill="#3b82f6" radius={[6,6,0,0]} />
                  <Bar dataKey="hours" name="Hours" fill="#a855f7" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* ── Row 4: Recent Tasks Table ── */}
        <Card>
          <SectionTitle>All Tasks — Quick Overview</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Task","Department","Employee","Time","CC","Status","Created","Flags"].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => {
                  const st = { pending:"#f97316", Accepted:"#3b82f6", VerifyTask:"#a855f7", Completed:"#22c55e", Done:"#10b981" };
                  const stBg = { pending:"#fff7ed", Accepted:"#eff6ff", VerifyTask:"#fdf4ff", Completed:"#f0fdf4", Done:"#ecfdf5" };
                  return (
                    <tr key={t._id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-700 text-sm">{t.tname}</p>
                        <p className="text-xs text-gray-400 font-mono">{t._id?.slice(-8)}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-500">
                        <p>{t.rdep}</p>
                        <p className="text-gray-400">{t.rsubdep}</p>
                      </td>
                      <td className="py-3 px-3">
                        {t.apname ? (
                          <div className="flex items-center gap-2">
                            <img src={t.apdp || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                              className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0"
                              onError={e => { e.target.src="https://cdn-icons-png.flaticon.com/512/847/847969.png"; }} />
                            <span className="text-xs font-medium text-gray-700">{t.apname}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs font-semibold text-gray-700">{t.ttime}h</td>
                      <td className="py-3 px-3 text-xs font-semibold text-gray-700">{t.tcc} CC</td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ color: st[t.tstatus]||"#64748b", background: stBg[t.tstatus]||"#f8fafc" }}>
                          {t.tstatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-400 whitespace-nowrap">{fmt(t.tmt)}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {t.timeranout && <span className="text-xs bg-red-50 text-red-500 border border-red-200 rounded-full px-2 py-0.5">⏰ Timed Out</span>}
                          {t.tmoretime  && <span className="text-xs bg-amber-50 text-amber-500 border border-amber-200 rounded-full px-2 py-0.5">🕐 Extra Time</span>}
                          {t.tfeedback  && <span className="text-xs bg-green-50 text-green-500 border border-green-200 rounded-full px-2 py-0.5">💬 Feedback</span>}
                          {t.reassignedAt && <span className="text-xs bg-purple-50 text-purple-500 border border-purple-200 rounded-full px-2 py-0.5">🔄 Reassigned</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default TaskDashboard;