import { useRef, useState } from "react";
import { FiSend, FiSquare, FiUpload } from "react-icons/fi";
import RichTextEditor from "../../userside/utils/PichTextEditor";
import MailModal from "./MailModal";
import { errorMessage, useSubmitGuard } from "./mailApi";
import { MAX_RECIPIENTS, absoluteUrls, confirmAction, escapeHtml, hasBody, splitAddresses, toastError, toastSuccess } from "./mailUtils";

const empty = { from: "", senderName: "", to: "", cc: "", bcc: "", subject: "", html: "" };

// Bulk mode sends one email per recipient, so this caps the batch, not one email.
const MAX_BULK_RECIPIENTS = 500;
const EMAIL_RE = /^[^\s@<>(),;:]+@[^\s@<>(),;:]+\.[^\s@<>(),;:]+$/;

const DELAYS = [
  { label: "Fast (0.5s)", value: 500 },
  { label: "Normal (1s)", value: 1000 },
  { label: "Safe (2s)", value: 2000 },
  { label: "Slow (3s)", value: 3000 },
];

const DEFAULT_SIGNATURE = `Best regards,

Prottoy
CEO, Cloud Company
prottoy.ceo@cloudcompany.cc
https://cloudcompany.cc
Dhaka, Bangladesh`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One recipient per line: "email" or "email, name". A CSV header row is skipped
// because its first column isn't an email address.
const parseRecipients = (text) => {
  const seen = new Set();
  const list = [];
  String(text || "").split(/\r?\n/).forEach((line) => {
    const parts = line.split(/[,;\t]/).map((s) => s.trim().replace(/^"|"$/g, ""));
    // A line of only addresses ("a@x.com, b@y.com") adds each one without a name.
    const emails = parts.every((p) => !p || EMAIL_RE.test(p)) ? parts.filter(Boolean) : [parts[0]];
    const name = emails.length === 1 && parts[1] && !EMAIL_RE.test(parts[1]) ? parts[1] : "";
    emails.forEach((email) => {
      const key = email.toLowerCase();
      if (!EMAIL_RE.test(email) || seen.has(key)) return;
      seen.add(key);
      list.push({ email, name });
    });
  });
  return list;
};

const signatureHtml = (text) =>
  text.trim() ? `<p><br></p><p>${escapeHtml(text.trim()).replace(/\n/g, "<br>")}</p>` : "";

const STATUS_STYLE = {
  pending: "text-gray-400",
  sending: "text-indigo-600",
  sent: "text-emerald-600",
  failed: "text-red-600",
};

// `initial` prefills the form (reply); `onSettled` runs after a send that was logged (sent or failed).
export default function MailCompose({ api, mailboxes, initial, onClose, onSettled }) {
  const isReply = Boolean(initial?.subject);
  const configured = mailboxes.filter((b) => b.configured);
  const [base] = useState(() => {
    const defaultBox = mailboxes.find((b) => b.key === initial?.from && b.configured)
      || mailboxes.find((b) => b.key === "support" && b.configured)
      || configured[0]
      || mailboxes[0];
    return { ...empty, ...initial, from: defaultBox?.key || "" };
  });
  const [form, setForm] = useState(base);
  const [showCopies, setShowCopies] = useState(false);
  const [submitting, guard] = useSubmitGuard();

  // Signature (both modes)
  const [useSignature, setUseSignature] = useState(!isReply);
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);

  // Bulk mode
  const [bulk, setBulk] = useState(false);
  const [recipientText, setRecipientText] = useState("");
  const [senders, setSenders] = useState(() => (base.from ? [base.from] : []));
  const [greeting, setGreeting] = useState(true);
  const [delayMs, setDelayMs] = useState(1000);
  const [results, setResults] = useState([]);
  const stopRef = useRef(false);
  const fileRef = useRef(null);

  const recipients = bulk ? parseRecipients(recipientText) : [];
  const done = results.filter((r) => r.status === "sent" || r.status === "failed").length;

  const dirty = Object.keys(empty).some((key) => form[key] !== base[key]) || Boolean(recipientText.trim());
  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });
  const selected = mailboxes.find((b) => b.key === form.from);

  const toggleSender = (key) =>
    setSenders((prev) => (prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key]));

  const handleCsv = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseRecipients(reader.result);
      if (!parsed.length) return toastError("No email addresses found. Use columns: email, name");
      setRecipientText(parsed.map((r) => (r.name ? `${r.email}, ${r.name}` : r.email)).join("\n"));
      toastSuccess(`${parsed.length} recipients imported`);
    };
    reader.readAsText(file);
  };

  const buildHtml = (name) => {
    const hello = bulk && greeting && name ? `<p>Hi ${escapeHtml(name)},</p><p><br></p>` : "";
    const sig = useSignature ? signatureHtml(signature) : "";
    return absoluteUrls(`${hello}${form.html}${sig}`);
  };

  const sendBulk = async () => {
    if (!recipients.length) return toastError("Add at least one recipient.");
    if (recipients.length > MAX_BULK_RECIPIENTS) return toastError(`At most ${MAX_BULK_RECIPIENTS} recipients per bulk send.`);
    const fromKeys = senders.filter((k) => configured.some((b) => b.key === k));
    if (!fromKeys.length) return toastError("Pick at least one configured sender mailbox.");

    const ok = await confirmAction({
      title: `Send to ${recipients.length} recipient(s)?`,
      text: `Rotating between ${fromKeys.length} sender mailbox(es), ${delayMs / 1000}s between emails.`,
      confirmText: "Yes, send all",
      danger: false,
    });
    if (!ok) return;

    const cc = splitAddresses(form.cc);
    const bcc = splitAddresses(form.bcc);
    const list = recipients.map((r) => ({ ...r, status: "pending", from: "", error: "" }));
    setResults(list);
    stopRef.current = false;

    const update = (i, patch) => {
      list[i] = { ...list[i], ...patch };
      setResults([...list]);
    };

    for (let i = 0; i < list.length; i++) {
      if (stopRef.current) break;
      const from = fromKeys[i % fromKeys.length];
      update(i, { status: "sending", from });
      const payload = { from, to: [list[i].email], subject: form.subject.trim(), html: buildHtml(list[i].name) };
      if (cc.length) payload.cc = cc;
      if (bcc.length) payload.bcc = bcc;
      if (form.senderName.trim()) payload.senderName = form.senderName.trim();

      const res = await api("/mail/send", "POST", payload);
      if (res.status === 401) return;
      update(i, res.success ? { status: "sent" } : { status: "failed", error: errorMessage(res, "Failed") });
      if (i < list.length - 1 && !stopRef.current) await sleep(delayMs);
    }

    onSettled?.();
    const sent = list.filter((r) => r.status === "sent").length;
    const failed = list.filter((r) => r.status === "failed").length;
    const skipped = list.length - sent - failed;
    if (failed || skipped) {
      toastError(`${sent} sent, ${failed} failed${skipped ? `, ${skipped} not sent (stopped)` : ""}. See the list below and Sent for details.`);
    } else {
      toastSuccess(`${sent} emails sent`);
    }
  };

  const sendOne = async () => {
    const to = splitAddresses(form.to);
    const cc = splitAddresses(form.cc);
    const bcc = splitAddresses(form.bcc);
    if (!to.length) return toastError("Add at least one recipient.");
    if (to.length + cc.length + bcc.length > MAX_RECIPIENTS) return toastError(`At most ${MAX_RECIPIENTS} recipients per email (to, cc and bcc combined).`);
    if (!selected?.configured) return toastError("The selected mailbox is not configured on the server.");

    const payload = { from: form.from, to, subject: form.subject.trim(), html: buildHtml("") };
    if (cc.length) payload.cc = cc;
    if (bcc.length) payload.bcc = bcc;
    if (form.senderName.trim()) payload.senderName = form.senderName.trim();

    const data = await api("/mail/send", "POST", payload);
    if (data.success) {
      toastSuccess("Email sent");
      onSettled?.();
      onClose();
      return;
    }
    if (data.status === 401) return;
    // A 502 (SMTP failure) is still logged as a failed email in Sent.
    if (data.status === 502) onSettled?.();
    toastError(errorMessage(data, "Could not send the email."));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    guard(async () => {
      if (!hasBody(form.html)) return toastError("Write a message first.");
      return bulk ? sendBulk() : sendOne();
    });
  };

  const sendLabel = bulk ? `Send ${recipients.length} email${recipients.length === 1 ? "" : "s"}` : "Send";
  const sendingLabel = bulk && results.length ? `Sending ${Math.min(done + 1, results.length)} of ${results.length}…` : "Sending…";

  return (
    <MailModal title={isReply ? "Reply" : "Compose email"} onClose={onClose} dirty={dirty} busy={submitting}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isReply && (
          <div className="flex rounded-lg border border-gray-300 p-1 w-full sm:w-auto sm:self-start">
            {[["Single email", false], ["Bulk send", true]].map(([label, value]) => (
              <button
                key={label}
                type="button"
                disabled={submitting}
                onClick={() => { setBulk(value); setResults([]); }}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${bulk === value ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {bulk ? (
            <div>
              <span className="mlabel">Send from (rotates between selected)</span>
              <div className="flex flex-col gap-1.5">
                {mailboxes.map((b) => (
                  <label key={b.key} className={`flex items-center gap-2 text-sm ${b.configured ? "text-gray-700 cursor-pointer" : "text-gray-400"}`}>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      disabled={!b.configured || submitting}
                      checked={senders.includes(b.key)}
                      onChange={() => toggleSender(b.key)}
                    />
                    <span className="break-all">{b.address}{b.configured ? "" : " (not configured)"}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="mlabel" htmlFor="mail-from">From</label>
              <select id="mail-from" className="mselect select-md w-full" required {...field("from")}>
                {mailboxes.map((b) => (
                  <option key={b.key} value={b.key} disabled={!b.configured}>
                    {b.address}{b.configured ? "" : " (not configured)"}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mlabel" htmlFor="mail-sender">Sender name (optional)</label>
            <input id="mail-sender" className="minput" maxLength={100} placeholder={bulk ? "Mailbox name" : selected?.name || ""} {...field("senderName")} />
          </div>
        </div>

        {bulk ? (
          <div>
            <div className="flex items-end justify-between gap-2">
              <label className="mlabel" htmlFor="mail-recipients">Recipients ({recipients.length})</label>
              <button type="button" className="mbtn mbtn-simple mbtn-sm mb-1" onClick={() => fileRef.current?.click()} disabled={submitting}>
                <FiUpload className="w-3.5 h-3.5" /> Import CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={handleCsv} />
            </div>
            <textarea
              id="mail-recipients"
              className="textarea textarea-bordered w-full bg-white text-gray-800 border-gray-300 font-mono text-sm"
              rows={5}
              disabled={submitting}
              placeholder={"one per line: email, name\njane@example.com, Jane\nbob@example.com"}
              value={recipientText}
              onChange={(e) => setRecipientText(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              One email per recipient, so nobody sees the others. Paste addresses or import a CSV with columns <code className="bg-gray-100 px-1 rounded">email, name</code>. Max {MAX_BULK_RECIPIENTS}.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-end justify-between">
              <label className="mlabel" htmlFor="mail-to">To</label>
              {!showCopies && !form.cc && !form.bcc && (
                <button type="button" className="mb-1 text-xs font-semibold text-teal-600 hover:underline" onClick={() => setShowCopies(true)}>
                  Cc / Bcc
                </button>
              )}
            </div>
            <input id="mail-to" className="minput" required placeholder="name@example.com, other@example.com" {...field("to")} />
            <p className="text-xs text-gray-500 mt-1">Up to {MAX_RECIPIENTS} recipients in total. Separate addresses with commas.</p>
          </div>
        )}

        {(showCopies || form.cc || form.bcc) && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="mlabel" htmlFor="mail-cc">Cc{bulk ? " (added to every email)" : ""}</label>
              <input id="mail-cc" className="minput" {...field("cc")} />
            </div>
            <div>
              <label className="mlabel" htmlFor="mail-bcc">Bcc{bulk ? " (added to every email)" : ""}</label>
              <input id="mail-bcc" className="minput" {...field("bcc")} />
            </div>
          </div>
        )}

        <div>
          <label className="mlabel" htmlFor="mail-subject">Subject</label>
          <input id="mail-subject" className="minput" required maxLength={300} {...field("subject")} />
        </div>

        <div>
          <span className="mlabel">Message</span>
          {bulk && greeting && (
            <p className="text-xs text-gray-500 mb-1">Starts with &ldquo;Hi &#123;name&#125;,&rdquo; for recipients that have a name.</p>
          )}
          <RichTextEditor
            value={base.html}
            onChange={(html) => setForm((f) => ({ ...f, html }))}
            placeholder="Write your message..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input type="checkbox" className="checkbox checkbox-sm" checked={useSignature} onChange={(e) => setUseSignature(e.target.checked)} />
            Add signature
          </label>
          {useSignature && (
            <textarea
              className="textarea textarea-bordered w-full bg-white text-gray-800 border-gray-300 text-sm"
              rows={6}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
          )}
        </div>

        {bulk && (
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" className="checkbox checkbox-sm" checked={greeting} onChange={(e) => setGreeting(e.target.checked)} />
              Greet by name (&ldquo;Hi Jane,&rdquo;)
            </label>
            <div>
              <label className="mlabel" htmlFor="mail-delay">Delay between emails</label>
              <select id="mail-delay" className="mselect select-md w-full" value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} disabled={submitting}>
                {DELAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {bulk && results.length > 0 && (
          <div className="mcard p-3">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
              <span>Progress</span>
              <span>{done} / {results.length}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(done / results.length) * 100}%` }} />
            </div>
            <ul className="max-h-48 overflow-y-auto text-xs divide-y divide-gray-100">
              {results.map((r) => (
                <li key={r.email} className="flex flex-wrap items-center justify-between gap-x-3 py-1.5">
                  <span className="break-all text-gray-700">{r.email}{r.name ? ` (${r.name})` : ""}</span>
                  <span className={`font-semibold capitalize ${STATUS_STYLE[r.status]}`} title={r.error || r.from}>
                    {r.status}{r.status === "failed" && r.error ? `: ${r.error}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {bulk && submitting && results.length > 0 && (
            <button type="button" className="mbtn mbtn-danger" onClick={() => { stopRef.current = true; }}>
              <FiSquare className="w-4 h-4" /> Stop
            </button>
          )}
          <button type="submit" className="mbtn mbtn-gradient" disabled={submitting} aria-busy={submitting}>
            {submitting ? <span className="loading loading-spinner loading-xs" /> : <FiSend className="w-4 h-4" />}
            {submitting ? sendingLabel : sendLabel}
          </button>
        </div>
      </form>
    </MailModal>
  );
}
