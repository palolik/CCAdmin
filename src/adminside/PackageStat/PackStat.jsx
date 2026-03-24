import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";

const StatusBadge = ({ status }) => {
  const config = {
    approved: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      ring: "ring-emerald-200",
    },
    rejected: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      dot: "bg-rose-500",
      ring: "ring-rose-200",
    },
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-400",
      ring: "ring-amber-200",
    },
  };
  const s = config[status] || config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${s.bg} ${s.text} ${s.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : "Pending"}
    </span>
  );
};

const PackStat = () => {
  useEffect(() => {
    document.title = "Package Statistics";
  }, []);

  const loaderpacks = useLoaderData();
  const [packs, setpacks] = useState(loaderpacks);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetch(`${base_url}/packages`)
      .then((res) => res.json())
      .then((data) => setpacks(data))
      .catch((error) => console.error("Error fetching classes:", error));
  }, []);

  const handleDelete = (_id) => {
    Swal.fire({
      title: "Delete this package?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      customClass: { popup: "rounded-2xl" },
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${base_url}/delpackage/${_id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire({
                title: "Deleted!",
                text: "The package has been removed.",
                icon: "success",
                customClass: { popup: "rounded-2xl" },
              }).then(() => {
                setpacks(packs.filter((pack) => pack._id !== _id));
              });
            }
          })
          .catch((error) => console.error("Error deleting pack:", error));
      }
    });
  };

  const handleStatusChange = (packId, newStatus) => {
    fetch(`${base_url}/packagestatus/${packId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.modifiedCount > 0 || data.acknowledged) {
          Swal.fire({
            icon: "success",
            title: "Status Updated",
            text: `Changed to ${newStatus}`,
            timer: 1500,
            showConfirmButton: false,
            customClass: { popup: "rounded-2xl" },
          });
          setpacks((prev) =>
            prev.map((p) =>
              p._id === packId ? { ...p, status: newStatus } : p
            )
          );
        }
      })
      .catch(() => {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not update status.",
          customClass: { popup: "rounded-2xl" },
        });
      });
  };

  const filtered = packs.filter((pack) => {
    const matchSearch =
      pack.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (pack.status || "pending") === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: packs.length,
    approved: packs.filter((p) => p.status === "approved").length,
    pending: packs.filter((p) => !p.status || p.status === "pending").length,
    rejected: packs.filter((p) => p.status === "rejected").length,
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Package Statistics
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage and monitor all your service packages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              {filtered.length} of {packs.length} packages
            </span>
          </div>
        </div>
      </div>

      <div className="  px-6 py-6 space-y-6">
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-slate-700", bg: "bg-white", border: "border-slate-200" },
            { label: "Approved", value: stats.approved, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Pending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            { label: "Rejected", value: stats.rejected, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} border ${s.border} rounded-xl px-5 py-4 shadow-sm`}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {s.label}
              </p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row gap-3 shadow-sm">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or category…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "approved", "pending", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterStatus === s
                    ? "bg-blue-600 text-white shadow"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    "Category",
                    "Package",
                    "Pricing",
                    "Performance",
                    
                    "Contents",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-16 text-slate-400"
                    >
                      <svg className="w-10 h-10 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      No packages found
                    </td>
                  </tr>
                ) : (
                  filtered.map((pack) => (
                    <>
                      <tr
                        key={pack._id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() =>
                          setExpandedRow(
                            expandedRow === pack._id ? null : pack._id
                          )
                        }
                      >
                        {/* Category */}
                        <td className="px-4 py-3">
                          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-blue-100">
                            {pack.category}
                          </span>
                        </td>

                        {/* Package Name */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 max-w-[160px] truncate">
                            {pack.packageName}
                          </div>
                        </td>

                        {/* Pricing */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-600 font-bold">
                                ${pack.packagePrice}
                              </span>
                              <span className="text-xs text-slate-400">
                                · {pack.deliveryTime}d
                              </span>
                            </div>
                            {pack.expressDeliveryPrice && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-600 font-semibold text-xs">
                                  ⚡ ${pack.expressDeliveryPrice}
                                </span>
                                <span className="text-xs text-slate-400">
                                  · {pack.expressDeliveryTime}d
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Performance */}
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <div className="text-center">
                              <p className="text-xs text-slate-400 font-medium">
                                Clicks
                              </p>
                              <p className="font-bold text-slate-700">
                                {pack.clicks ?? 0}
                              </p>
                            </div>
                            <div className="w-px bg-slate-200" />
                            <div className="text-center">
                              <p className="text-xs text-slate-400 font-medium">
                                Sold
                              </p>
                              <p className="font-bold text-slate-700">
                                {pack.tsold ?? 0}
                              </p>
                            </div>
                          </div>
                        </td>

              

                        {/* Contents */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {pack.packageContents
                              ?.filter((c) => c && c.trim())
                              .slice(0, 3)
                              .map((content, i) => (
                                <span
                                  key={i}
                                  className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md"
                                >
                                  {content}
                                </span>
                              ))}
                            {pack.packageContents?.filter((c) => c && c.trim())
                              .length > 3 && (
                              <span className="text-xs text-slate-400">
                                +
                                {pack.packageContents.filter((c) => c && c.trim())
                                  .length - 3}{" "}
                                more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={pack.status || "pending"}
                            onChange={(e) =>
                              handleStatusChange(pack._id, e.target.value)
                            }
                            className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                              pack.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400"
                                : pack.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-400"
                                : "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/admin/packageupdate/${pack._id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(pack._id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-600 hover:text-white transition-colors border border-rose-200"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded Row ── */}
                      {expandedRow === pack._id && (
                        <tr key={`${pack._id}-expanded`} className="bg-blue-50/40">
                          <td colSpan={8} className="px-6 py-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Full Details */}
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                  Package Details
                                </h4>
                                {pack.packageDetails ? (
                                  <div
                                    className="prose prose-sm max-w-none text-slate-700 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                                    dangerouslySetInnerHTML={{
                                      __html: pack.packageDetails,
                                    }}
                                  />
                                ) : (
                                  <p className="text-slate-400 italic text-sm">
                                    No details provided.
                                  </p>
                                )}
                              </div>

                              {/* All Contents */}
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                  All Contents
                                </h4>
                                <ul className="space-y-1">
                                  {pack.packageContents
                                    ?.filter((c) => c && c.trim())
                                    .map((content, i) => (
                                      <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-slate-700"
                                      >
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                        {content}
                                      </li>
                                    ))}
                                </ul>
                              </div>

                              {/* Requirements */}
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                  Requirements
                                </h4>
                                <p className="text-sm text-slate-700">
                                  {pack.packageRequirements || (
                                    <span className="text-slate-400 italic">
                                      No requirements specified.
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400">
              Showing {filtered.length} package{filtered.length !== 1 ? "s" : ""}
              {filterStatus !== "all" && ` · filtered by "${filterStatus}"`}
              {searchTerm && ` · matching "${searchTerm}"`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackStat;