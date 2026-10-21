import { useEffect, useState } from "react";
import { base_url } from "../../config/config";

// CC Events dashboard (analytics + notification rules) for Cloud Company,
// embedded read-only. The link is served by the API to logged-in admins
// because the link itself grants access.
const EventAnalytics = () => {
  const [url, setUrl] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    fetch(`${base_url}/admin/eventsdashboardlink`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        setUrl(data.url);
        setStatus(data.url ? "ready" : "unconfigured");
      })
      .catch((err) => {
        console.error("Event analytics link error:", err);
        setStatus("error");
      });
  }, []);

  return (
    <div className="p-4 h-full flex flex-col">
      <h1 className="text-2xl font-semibold mb-4">Event Analytics</h1>

      {status === "loading" && <p className="text-gray-500">Loading…</p>}
      {status === "unconfigured" && (
        <p className="text-gray-600">
          CC Events dashboard isn&apos;t set up yet. Set CC_EVENTS_DASHBOARD_URL on the server.
        </p>
      )}
      {status === "error" && (
        <p className="text-red-600">Couldn&apos;t load the dashboard. Please log in again and retry.</p>
      )}
      {status === "ready" && (
        <iframe
          title="CC Events dashboard"
          src={url}
          className="w-full flex-1 min-h-[80vh] border border-gray-200 rounded-lg bg-white"
        />
      )}
    </div>
  );
};

export default EventAnalytics;
