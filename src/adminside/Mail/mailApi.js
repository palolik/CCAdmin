import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base_url } from "../../config/config";
import { toastError } from "./mailUtils";

const SESSION_EXPIRED = "Your session has expired. Please log in again.";
const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";
const FALLBACK_ERROR = "Something went wrong. Please try again.";

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// A readable message for a status code the server sent without a JSON message.
const statusMessage = (status) => {
  if (status === 0) return NETWORK_ERROR;
  if (status === 401) return SESSION_EXPIRED;
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "The requested item was not found.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return `The server had a problem (${status}). Please try again.`;
  return `Request failed (${status}).`;
};

// Parses a response body as JSON without throwing; undefined when it isn't JSON.
const readBody = async (res) => {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
};

// Message to show for a failed request result.
export const errorMessage = (data, fallback = FALLBACK_ERROR) =>
  (isObject(data) && typeof data.message === "string" && data.message) || fallback;

// Resolves (never rejects). A failure is always { success: false, status, message }, where
// message is the server's own message when it sent one (e.g. the 502/503 SMTP/IMAP errors).
async function mailRequest(token, path, method = "GET", body) {
  const headers = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res;
  try {
    res = await fetch(`${base_url}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { success: false, status: 0, message: NETWORK_ERROR };
  }
  const data = await readBody(res);
  if (!res.ok) {
    const message = (isObject(data) && typeof data.message === "string" && data.message) || statusMessage(res.status);
    return { ...(isObject(data) ? data : {}), success: false, status: res.status, message };
  }
  if (data === undefined) return { success: false, status: res.status, message: "The server sent an unexpected response." };
  return data;
}

// Request helper bound to the admin token from /adminlogin (the same token the Event Analytics
// page sends). A 401 means the token expired: the admin is logged out and sent to /admin/login.
export function useMailApi() {
  const navigate = useNavigate();
  const expired = useRef(false);

  return useCallback(async (path, method = "GET", body) => {
    const data = await mailRequest(localStorage.getItem("adminToken"), path, method, body);
    if (data.status === 401 && !expired.current) {
      expired.current = true;
      toastError(SESSION_EXPIRED);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      navigate("/admin/login");
    }
    return data;
  }, [navigate]);
}

export const PAGE_SIZE = 20;

const normalizePaged = (data) => ({
  items: Array.isArray(data?.items) ? data.items : [],
  total: Number(data?.total) || 0,
  page: Number(data?.page) || 1,
  limit: Number(data?.limit) || PAGE_SIZE,
  pages: Math.max(1, Number(data?.pages) || 1),
  unread: Number(data?.unread) || 0,
});

// Server-side paginated list with debounced search and exact-match filters.
export function usePagedList(api, path, { filters = {}, limit = PAGE_SIZE, debounceMs = 300 } = {}) {
  const [data, setData] = useState(() => normalizePaged(null));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const filterKey = JSON.stringify(filters);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), debounceMs);
    return () => clearTimeout(t);
  }, [search, debounceMs]);

  // A new search or filter always starts again from page 1 (reset during render, so the
  // stale page is never requested).
  const queryKey = `${q}|${filterKey}`;
  const [lastQueryKey, setLastQueryKey] = useState(queryKey);
  if (lastQueryKey !== queryKey) {
    setLastQueryKey(queryKey);
    setPage(1);
  }

  const requestKey = `${page}|${queryKey}`;
  const lastLoaded = useRef(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    Object.entries(JSON.parse(filterKey)).forEach(([key, val]) => { if (val) params.set(key, val); });
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await api(`${path}?${params}`);
      if (id !== requestId.current) return; // a newer request superseded this one
      // A failed reload keeps the rows already on screen.
      if (!Array.isArray(res?.items)) {
        if (res?.status !== 401) toastError(errorMessage(res, "Could not load the emails."));
        return;
      }
      const next = normalizePaged(res);
      // The current page emptied (e.g. its last row was deleted): step back.
      if (next.items.length === 0 && page > 1 && next.total > 0) {
        setPage(Math.min(page - 1, next.pages));
        return;
      }
      setData(next);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [api, path, page, q, filterKey, limit]);

  useEffect(() => {
    if (lastLoaded.current === requestKey) return;
    lastLoaded.current = requestKey;
    load();
  }, [load, requestKey]);

  // Merge a change into the visible rows (call reload() afterwards to resync).
  const patchRow = useCallback((id, patch) => {
    setData((d) => ({ ...d, items: d.items.map((r) => (r._id === id ? { ...r, ...patch } : r)) }));
  }, []);

  return {
    rows: data.items,
    total: data.total,
    page: data.page,
    pages: data.pages,
    limit: data.limit,
    unread: data.unread,
    setPage,
    search,
    setSearch,
    loading,
    reload: load,
    patchRow,
  };
}

// Runs one async action at a time. The ref blocks a second call synchronously (before React
// re-renders the disabled button), so a double click never sends two requests.
export function useSubmitGuard() {
  const busy = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const guard = useCallback(async (action) => {
    if (busy.current) return undefined;
    busy.current = true;
    setSubmitting(true);
    try {
      return await action();
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }, []);

  return [submitting, guard];
}
