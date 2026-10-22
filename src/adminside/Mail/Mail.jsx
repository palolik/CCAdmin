import "./mail.css";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { FiEdit3, FiMail, FiRefreshCw, FiCheckCircle, FiCornerUpLeft, FiTrash2 } from "react-icons/fi";
import MailCompose from "./MailCompose";
import MailModal from "./MailModal";
import { PAGE_SIZE, errorMessage, useMailApi, usePagedList, useSubmitGuard } from "./mailApi";
import {
  FOLDERS, MAIL_PATH, confirmAction, emailDocument, replyForm, toList, toastError, toastSuccess, when,
} from "./mailUtils";

const TITLES = { inbox: "Inbox", sent: "Sent" };

// Inbox and Sent share one page. The mailbox list is loaded once here; keying the folder view
// by folder gives each folder a fresh email list.
export default function Mail() {
  const { folder } = useParams();
  const api = useMailApi();
  const [mailboxes, setMailboxes] = useState([]);
  const [mailboxesLoaded, setMailboxesLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    api("/mail/mailboxes").then((data) => {
      if (!active) return;
      if (data.success && Array.isArray(data.data)) setMailboxes(data.data);
      else if (data.status !== 401) toastError(errorMessage(data, "Could not load the mailboxes."));
      setMailboxesLoaded(true);
    });
    return () => { active = false; };
  }, [api]);

  if (!FOLDERS.includes(folder)) return <Navigate to={`${MAIL_PATH}/inbox`} replace />;
  return <MailFolder key={folder} folder={folder} api={api} mailboxes={mailboxes} mailboxesLoaded={mailboxesLoaded} />;
}

function StatusBadge({ status, error }) {
  if (status === "failed") {
    return (
      <span className="tooltip tooltip-left" data-tip={error || "Delivery failed"}>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">failed</span>
      </span>
    );
  }
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{status || "sent"}</span>;
}


function Pagination({ page, pages, total, limit, count, onPage, loading }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = total === 0 ? 0 : Math.min(total, from + count - 1);
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mt-4 text-sm">
      <span className="text-gray-500">
        Showing {from}–{to} of {total}
        {loading && <span className="loading loading-spinner loading-xs ml-2 align-middle" />}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-1 flex-wrap">
          <button type="button" className="mbtn mbtn-sm mbtn-simple" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}>« Prev</button>
          {pageList(page, pages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-gray-400">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`mbtn mbtn-sm ${p === page ? "mbtn-gradient" : "mbtn-simple"}`}
                aria-current={p === page ? "page" : undefined}
                disabled={loading}
                onClick={() => p !== page && onPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button type="button" className="mbtn mbtn-sm mbtn-simple" disabled={page >= pages || loading} onClick={() => onPage(page + 1)}>Next »</button>
        </div>
      )}
    </div>
  );
}


function MailFolder({ folder, api, mailboxes, mailboxesLoaded }) {
  const isInbox = folder === "inbox";
  const [mailbox, setMailbox] = useState("");
  const [status, setStatus] = useState("");
  const listState = usePagedList(api, "/mail/emails", { filters: { type: folder, mailbox, status }, limit: PAGE_SIZE });
  const { rows } = listState;

  const [viewing, setViewing] = useState(null); // { email, full: bool }
  const [composing, setComposing] = useState(null); // null | composer prefill ({} for a new email)
  const [boxAction, setBoxAction] = useState(""); // "<key>:sync" | "<key>:verify" while running
  const [boxBusy, guardBox] = useSubmitGuard();
  const [saving, guard] = useSubmitGuard();

  const boxLabel = (address) => mailboxes.find((b) => b.address === address)?.key || address;

  const runBoxAction = (box, action, run) => guardBox(async () => {
    setBoxAction(`${box.key}:${action}`);
    try {
      await run();
    } finally {
      setBoxAction("");
    }
  });

  const syncBox = (box) => runBoxAction(box, "sync", async () => {
    const data = await api("/mail/inbox/sync", "POST", { mailbox: box.key });
    if (data.status === 401) return;
    if (!data.success) return toastError(errorMessage(data, `Could not sync ${box.address}.`));
    const n = Number(data.data?.synced) || 0;
    toastSuccess(`Synced ${n} message${n === 1 ? "" : "s"} from ${box.address}`);
    if (isInbox) listState.reload();
  });

  const verifyBox = (box) => runBoxAction(box, "verify", async () => {
    const data = await api(`/mail/mailboxes/${encodeURIComponent(box.key)}/verify`, "POST", {});
    if (data.status === 401) return;
    if (data.success && data.data?.success !== false) toastSuccess(`${box.address}: login OK`);
    else toastError(`${box.address}: ${data.data?.message || errorMessage(data, "SMTP login failed.")}`);
  });

  const setRead = (email, read) => guard(async () => {
    const data = await api(`/mail/emails/${email._id}/read`, "PATCH", { read });
    if (data.status === 401) return;
    if (!data.success) return toastError(errorMessage(data, "Could not update the email."));
    listState.patchRow(email._id, { read });
    setViewing((v) => (v && v.email._id === email._id ? { ...v, email: { ...v.email, read } } : v));
    listState.reload(); // refreshes the unread count
  });

  const openEmail = async (row) => {
    setViewing({ email: row, full: false });
    const data = await api(`/mail/emails/${row._id}`);
    if (!data.success || !data.data) {
      if (data.status !== 401) toastError(errorMessage(data, "Could not open the email."));
      setViewing((v) => (v && v.email._id === row._id ? null : v));
      return;
    }
    setViewing((v) => (v && v.email._id === row._id ? { email: data.data, full: true } : v));
    if (isInbox && !row.read) setRead(row, true);
  };

  const handleDelete = (email) => guard(async () => {
    const ok = await confirmAction({
      title: "Delete this email?",
      text: `"${email.subject || "(no subject)"}" is removed from the admin log only, not from the mailbox itself.`,
      confirmText: "Yes, delete it!",
    });
    if (!ok) return;
    const data = await api(`/mail/emails/${email._id}`, "DELETE");
    if (data.status === 401) return;
    if (!data.success) return toastError(errorMessage(data, "Could not delete the email."));
    toastSuccess("Email deleted");
    setViewing((v) => (v && v.email._id === email._id ? null : v));
    listState.reload();
  });

  const reply = (email) => {
    setViewing(null);
    setComposing(replyForm(email, mailboxes));
  };

  const email = viewing?.email;
  const columns = isInbox ? 5 : 6;

  return (
    <div className="flex-1 min-w-0">
      <div className="mhdr">
        <span className="flex items-center gap-2 min-w-0 flex-wrap">
          <FiMail className="w-5 h-5 text-indigo-600 shrink-0" />
          Mail · {TITLES[folder]}
          {isInbox && listState.unread > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {listState.unread} unread
            </span>
          )}
        </span>
        <button type="button" className="mbtn mbtn-gradient" onClick={() => setComposing({})} disabled={!mailboxesLoaded}>
          <FiEdit3 className="w-4 h-4" /> Compose
        </button>
      </div>

      <div className="w-full px-3 sm:px-6 py-4 flex flex-col gap-4">
        <div className="mcard p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Mailboxes</p>
          <div className="flex flex-col gap-2">
            {mailboxes.map((box) => (
              <div key={box.key} className="flex items-center justify-between gap-2 flex-wrap">
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-800 break-all">{box.address}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    box.configured
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {box.configured ? "configured" : "not configured"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="mbtn mbtn-sm mbtn-simple" disabled={boxBusy || !box.configured} onClick={() => verifyBox(box)}>
                    {boxAction === `${box.key}:verify` ? <span className="loading loading-spinner loading-xs" /> : <FiCheckCircle className="w-3.5 h-3.5" />}
                    Verify
                  </button>
                  <button type="button" className="mbtn mbtn-sm mbtn-gradient" disabled={boxBusy || !box.configured} onClick={() => syncBox(box)}>
                    {boxAction === `${box.key}:sync` ? <span className="loading loading-spinner loading-xs" /> : <FiRefreshCw className="w-3.5 h-3.5" />}
                    Sync inbox
                  </button>
                </div>
              </div>
            ))}
            {mailboxesLoaded && mailboxes.length === 0 && <p className="text-sm text-gray-400">No mailboxes available.</p>}
            {!mailboxesLoaded && <span className="loading loading-spinner loading-sm text-indigo-600" />}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <select className="mselect w-full sm:w-auto" aria-label="Mailbox filter" value={mailbox} onChange={(e) => setMailbox(e.target.value)}>
            <option value="">All mailboxes</option>
            {mailboxes.map((b) => <option key={b.key} value={b.key}>{b.address}</option>)}
          </select>
          {!isInbox && (
            <select className="mselect w-full sm:w-auto" aria-label="Status filter" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          )}
          <input
            type="search"
            aria-label="Search emails"
            className="input input-bordered input-sm bg-white border-gray-300 w-full sm:w-72 sm:ml-auto"
            placeholder="Search subject, from, to..."
            value={listState.search}
            onChange={(e) => listState.setSearch(e.target.value)}
          />
        </div>

        <div>
          <div className="ptable-wrap">
            <table className="ptable">
              <thead>
                <tr>
                  <th className="w-6"><span className="sr-only">Unread</span></th>
                  <th>{isInbox ? "From" : "To"}</th>
                  <th>Subject</th>
                  <th className="hidden md:table-cell">Mailbox</th>
                  {!isInbox && <th>Status</th>}
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const unread = isInbox && !row.read;
                  return (
                    <tr
                      key={row._id}
                      tabIndex={0}
                      onClick={() => openEmail(row)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEmail(row); } }}
                      className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-inset"
                    >
                      <td className="pr-0">
                        <span className={`block w-2 h-2 rounded-full ${unread ? "bg-indigo-600" : "bg-transparent"}`} aria-hidden="true" />
                        {unread && <span className="sr-only">Unread</span>}
                      </td>
                      <td className="max-w-[140px] sm:max-w-[220px]">
                        <span className={`block truncate ${unread ? "font-bold text-gray-900" : ""}`}>
                          {isInbox ? (row.senderName || row.from) : toList(row.to).join(", ")}
                        </span>
                      </td>
                      <td className="max-w-[180px] sm:max-w-[420px]">
                        <span className={`block truncate ${unread ? "font-semibold text-gray-900" : ""}`}>
                          {row.subject || "(no subject)"}
                        </span>
                        {row.text && <span className="block truncate text-xs text-gray-400 mt-0.5">{row.text.slice(0, 200)}</span>}
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 whitespace-nowrap">
                          {boxLabel(row.mailbox)}
                        </span>
                      </td>
                      {!isInbox && <td><StatusBadge status={row.status} error={row.error} /></td>}
                      <td className="whitespace-nowrap text-xs text-gray-500">{when(row.date)}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={columns} className="text-center py-10 text-gray-400">
                      {listState.loading
                        ? <span className="loading loading-spinner loading-md text-indigo-600" />
                        : listState.search
                          ? "No emails match your search."
                          : isInbox
                            ? 'No messages yet. Use "Sync inbox" to pull them from a mailbox.'
                            : "No sent emails yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={listState.page}
            pages={listState.pages}
            total={listState.total}
            limit={listState.limit}
            count={rows.length}
            onPage={listState.setPage}
            loading={listState.loading}
          />
        </div>
      </div>

      {email && (
        <MailModal title={email.subject || "(no subject)"} onClose={() => setViewing(null)} busy={saving}>
          <div className="space-y-1 text-sm text-gray-700 break-words">
            <p><span className="text-gray-400">From:</span> {email.senderName ? `${email.senderName} <${email.from}>` : email.from}</p>
            <p className="break-all"><span className="text-gray-400">To:</span> {toList(email.to).join(", ")}</p>
            {toList(email.cc).length > 0 && <p className="break-all"><span className="text-gray-400">Cc:</span> {toList(email.cc).join(", ")}</p>}
            {toList(email.bcc).length > 0 && <p className="break-all"><span className="text-gray-400">Bcc:</span> {toList(email.bcc).join(", ")}</p>}
            <p className="text-xs text-gray-400">{when(email.date)} · {email.mailbox}</p>
            {email.status === "failed" && (
              <div role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Not delivered: {email.error || "unknown error"}
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap my-4">
            <button type="button" className="mbtn mbtn-sm mbtn-gradient" onClick={() => reply(email)}>
              <FiCornerUpLeft className="w-3.5 h-3.5" /> Reply
            </button>
            {isInbox && (
              <button type="button" className="mbtn mbtn-sm mbtn-simple" disabled={saving} onClick={() => setRead(email, !email.read)}>
                Mark {email.read ? "unread" : "read"}
              </button>
            )}
            <button type="button" className="mbtn mbtn-sm mbtn-danger" disabled={saving} onClick={() => handleDelete(email)}>
              <FiTrash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>

          {viewing.full ? (
            // Untrusted HTML: sandbox="" (no scripts, no same-origin). Never rendered into this page's DOM.
            <iframe
              title="Email body"
              sandbox=""
              referrerPolicy="no-referrer"
              srcDoc={emailDocument(email)}
              className="w-full h-[55vh] min-h-72 rounded-lg border border-gray-200 bg-white"
            />
          ) : (
            <div className="flex justify-center py-16"><span className="loading loading-spinner loading-md text-indigo-600" /></div>
          )}
        </MailModal>
      )}

      {composing && (
        <MailCompose
          api={api}
          mailboxes={mailboxes}
          initial={composing}
          onClose={() => setComposing(null)}
          onSettled={() => { if (!isInbox) listState.reload(); }}
        />
      )}
    </div>
  );
}

