import { useState, useEffect } from "react";
import { base_url } from "../../config/config";
import { Mail, Send, Inbox, RefreshCw, Trash2, X, ChevronLeft } from "lucide-react";

const cardCls  = "bg-white border border-gray-200 rounded-2xl";
const titleCls = "flex items-center gap-2 text-sm font-medium text-gray-900 mb-4 pb-3 border-b border-gray-100";

// ── Format date ──────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const now  = new Date();
  const diff = now - date;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ── Email list item ──────────────────────────────────────────────────────────
const EmailRow = ({ email, tab, onClick, onDelete, selected }) => {
  const isInbox  = tab === "inbox";
  const from     = isInbox ? email.from : `To: ${Array.isArray(email.to) ? email.to.join(", ") : email.to}`;
  const date     = isInbox ? email.receivedAt : email.sentAt;
  const unread   = isInbox && !email.read;

  return (
    <div onClick={() => onClick(email)}
      className={`flex items-start gap-3 px-4 py-3.5 border-b border-gray-100 cursor-pointer transition-colors ${
        selected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-gray-50"
      }`}>

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
        isInbox ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
      }`}>
        {(isInbox ? email.from : (Array.isArray(email.to) ? email.to[0] : email.to) || "?")
          .charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`text-sm truncate ${unread ? "font-semibold text-gray-900" : "text-gray-700"}`}>
            {from}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">{fmtDate(date)}</span>
        </div>
        <p className={`text-xs truncate ${unread ? "font-medium text-gray-800" : "text-gray-500"}`}>
          {email.subject || "(no subject)"}
        </p>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {email.textBody || email.body?.replace(/<[^>]*>/g, "").slice(0, 80) || ""}
        </p>
      </div>

      {/* Unread dot */}
      {unread && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}

      {/* Delete — only for sent */}
      {tab === "sent" && (
        <button onClick={ev => { ev.stopPropagation(); onDelete(email._id); }}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

// ── Email detail view ────────────────────────────────────────────────────────
const EmailDetail = ({ email, tab, onClose, onDelete }) => {
  if (!email) return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <Mail className="w-10 h-10 text-gray-200 mb-3" />
      <p className="text-sm text-gray-400">Select an email to read</p>
    </div>
  );

  const isInbox = tab === "inbox";
  const date    = isInbox ? email.receivedAt : email.sentAt;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Detail header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-medium text-gray-900 mb-2">{email.subject || "(no subject)"}</h2>
          <div className="flex flex-col gap-1">
            {[
              ["From",    isInbox ? email.from : email.senderName ? `${email.senderName} <${email.from}>` : email.from],
              ["To",      Array.isArray(email.to) ? email.to.join(", ") : email.to],
              email.cc?.length ? ["CC", Array.isArray(email.cc) ? email.cc.join(", ") : email.cc] : null,
              ["Date",   new Date(date).toLocaleString()],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs">
                <span className="text-gray-400 w-10 flex-shrink-0">{k}</span>
                <span className="text-gray-700 truncate">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {tab === "sent" && (
            <button onClick={() => onDelete(email._id)}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-xl transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-y-auto p-6">
        {email.body ? (
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        ) : (
          <p className="text-sm text-gray-500 whitespace-pre-wrap">{email.textBody}</p>
        )}
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const EmailInbox = () => {
  const [tab, setTab]               = useState("inbox");
  const [emails, setEmails]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState("");
  const [refreshing, setRefreshing] = useState(false);

const fetchEmails = async (t = tab, isRefresh = false) => {
  isRefresh ? setRefreshing(true) : setLoading(true);
  try {
    // প্রথম load → DB থেকে fast, Refresh → IMAP থেকে fresh
    const endpoint = t === "inbox"
      ? (isRefresh ? `${base_url}/emails/inbox` : `${base_url}/emails/inbox/saved`)
      : `${base_url}/emails/${t}`;

    const res = await fetch(endpoint);
    const data = await res.json();

    // DB তে কিছু না থাকলে IMAP থেকে আনো
    if (t === "inbox" && !isRefresh && Array.isArray(data) && data.length === 0) {
      const imapRes = await fetch(`${base_url}/emails/inbox`);
      const imapData = await imapRes.json();
      setEmails(Array.isArray(imapData) ? imapData : []);
    } else {
      setEmails(Array.isArray(data) ? data : []);
    }

    setSelected(null);
  } catch (err) {
    console.error(err);
    setEmails([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => { fetchEmails(); }, [tab]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this email?")) return;
    try {
      await fetch(`${base_url}/emails/sent/${id}`, { method: "DELETE" });
      setEmails(p => p.filter(e => String(e._id) !== String(id)));
      if (selected && String(selected._id) === String(id)) setSelected(null);
    } catch (err) { console.error(err); }
  };

  const filtered = emails.filter(e =>
    !search ||
    e.subject?.toLowerCase().includes(search.toLowerCase()) ||
    e.from?.toLowerCase().includes(search.toLowerCase()) ||
    (Array.isArray(e.to) ? e.to.join(" ") : e.to || "").toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = emails.filter(e => tab === "inbox" && !e.read).length;

  return (
    <div className="w-full p-6 bg-white min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-medium text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            Email Inbox
          </h1>
          <p className="text-sm text-gray-400 font-light mt-0.5">
            prottoy.ceo@cloudcompany.cc
          </p>
        </div>
        <button onClick={() => fetchEmails(tab, true)} disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 border border-gray-200 hover:border-blue-200 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-5 h-[calc(100vh-180px)]">

        {/* ── LEFT: Email list ── */}
        <div className={`flex flex-col border border-gray-200 rounded-2xl overflow-hidden transition-all ${
          selected ? "w-80 flex-shrink-0" : "flex-1"
        }`}>

          {/* Tabs + search */}
          <div className="p-3 border-b border-gray-100 flex flex-col gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[
                { key: "inbox", label: "Inbox",     icon: <Inbox className="w-3.5 h-3.5" /> },
                { key: "sent",  label: "Sent",      icon: <Send  className="w-3.5 h-3.5" /> },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {t.icon}
                  {t.label}
                  {t.key === "inbox" && unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-400 transition-all bg-white placeholder:text-gray-300"
              placeholder="Search emails..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Stats bar */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">{filtered.length} email{filtered.length !== 1 ? "s" : ""}</span>
            {tab === "inbox" && unreadCount > 0 && (
              <span className="text-xs text-blue-500 font-medium">{unreadCount} unread</span>
            )}
          </div>

          {/* Email list */}
          <div className="flex-1 overflow-y-auto group">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <svg className="animate-spin w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <p className="text-xs text-gray-400">
                  {tab === "inbox" ? "Fetching emails from server..." : "Loading sent emails..."}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Mail className="w-8 h-8 text-gray-200" />
                <p className="text-sm text-gray-400">
                  {search ? "No emails match your search" : tab === "inbox" ? "Your inbox is empty" : "No sent emails yet"}
                </p>
              </div>
            ) : (
              filtered.map((email, i) => (
                <EmailRow key={email._id || i}
                  email={email}
                  tab={tab}
                  selected={selected?._id === email._id}
                  onClick={setSelected}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Email detail ── */}
        {selected && (
          <div className="flex-1 border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
            <EmailDetail
              email={selected}
              tab={tab}
              onClose={() => setSelected(null)}
              onDelete={handleDelete}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default EmailInbox;