import { useEffect, useMemo, useState } from "react";
import { MdInsights, MdOpenInNew } from "react-icons/md";
import { base_url } from "../../config/config";

// Cloud Company's look, handed to the embedded dashboard so it matches the
// admin panel: sky-500 accent on white.
const embedTheme = {
  mode: "light",
  primary: "#0ea5e9",
  bg: "#ffffff",
};

// Embeds the CC Events view-only dashboard. The link is fetched from the API
// (admin token required) rather than built into the bundle, because the link
// itself grants access to the analytics.
const EventAnalytics = () => {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    fetch(`${base_url}/admin/eventsdashboardlink`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Could not load analytics");
        setUrl(data.url || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const src = useMemo(() => {
    if (!url) return null;
    const target = new URL(url);
    Object.entries(embedTheme).forEach(([key, value]) => target.searchParams.set(key, value));
    return target.toString();
  }, [url]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-sky-50 text-sky-600">
            <MdInsights size={20} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Event Analytics</h1>
            <p className="text-xs text-gray-500">Client and employee activity tracked by CC Events</p>
          </div>
        </div>
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:text-sky-600"
          >
            <MdOpenInNew size={14} /> Open in new tab
          </a>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-100 bg-white shadow-md h-[calc(100vh-9rem)] min-h-[500px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : src ? (
          <iframe src={src} title="Event Analytics" className="w-full h-full border-0" />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 px-4 text-center">
            {error || "Event analytics is not configured on the server (CC_EVENTS_DASHBOARD_URL)."}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventAnalytics;
