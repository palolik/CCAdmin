import { useState, useRef } from "react";
import { base_url } from "../../config/config";
import Swal from "sweetalert2";
import { Mail, Plus, Send, Copy, X, Upload, Trash2, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Clock } from "lucide-react";
import RichTextEditor from "../../userside/utils/PichTextEditor";

// ── Your sender accounts ─────────────────────────────────────────────────────
const SENDER_ACCOUNTS = [
  { email: "prottoy.ceo@cloudcompany.cc", name: "Prottoy — Cloud Company" },
  { email: "info@cloudcompany.cc",         name: "Info — Cloud Company" },
  { email: "support@cloudcompany.cc",      name: "Support — Cloud Company" },
  // Add more as you create them in cPanel
];

const DEFAULT_SIGNATURE = `Best regards,

Prottoy
CEO, Cloud Company
📧 prottoy.ceo@cloudcompany.cc
🌐 https://cloudcompany.cc
📍 Dhaka, Bangladesh`;

const inp = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all bg-white placeholder:text-gray-300";
const cardCls  = "bg-white border border-gray-200 rounded-2xl p-5";
const titleCls = "flex items-center gap-2 text-sm font-medium text-gray-900 mb-4 pb-3 border-b border-gray-100";

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
  </div>
);

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    pending: { icon: <Clock className="w-3 h-3" />,        cls: "bg-gray-100 text-gray-500" },
    sending: { icon: <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>, cls: "bg-blue-50 text-blue-500" },
    sent:    { icon: <CheckCircle className="w-3 h-3" />,   cls: "bg-green-50 text-green-600" },
    failed:  { icon: <AlertCircle className="w-3 h-3" />,   cls: "bg-red-50 text-red-500" },
  };
  const { icon, cls } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {icon}{status}
    </span>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const EmailManager = () => {
  // Sender
  const [selectedSenders, setSelectedSenders] = useState([SENDER_ACCOUNTS[0].email]);
  const [senderDropdown, setSenderDropdown]   = useState(false);

  // Recipients
  const [recipients, setRecipients] = useState([
    { email: "", name: "", status: "pending" }
  ]);
  const fileInputRef = useRef(null);

  // Email content
  const [subject, setSubject]     = useState("");
  const [body, setBody]           = useState("");
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);
  const [showSig, setShowSig]     = useState(true);
  const [cc, setCc]               = useState("");
  const [bcc, setBcc]             = useState("");

  // Sending state
  const [sending, setSending]         = useState(false);
  const [sendLog, setSendLog]         = useState([]);
  const [progress, setProgress]       = useState(0);
  const [copied, setCopied]           = useState(false);
  const [delayMs, setDelayMs]         = useState(1000); // delay between sends

  // ── Sender selection ──────────────────────────────────────────────────────
  const toggleSender = (email) => {
    setSelectedSenders(prev =>
      prev.includes(email)
        ? prev.length > 1 ? prev.filter(e => e !== email) : prev
        : [...prev, email]
    );
  };

  // ── Recipients ────────────────────────────────────────────────────────────
  const addRecipient    = ()        => setRecipients(p => [...p, { email: "", name: "", status: "pending" }]);
  const removeRecipient = (i)       => setRecipients(p => p.filter((_, idx) => idx !== i));
  const updateRecipient = (i, k, v) => setRecipients(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const updateStatus = (i, status) => setRecipients(p => p.map((r, idx) => idx === i ? { ...r, status } : r));

  // ── CSV import ────────────────────────────────────────────────────────────
  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split("\n").filter(Boolean);
      const parsed = lines.slice(1).map(line => {
        const [email, name] = line.split(",").map(s => s.trim().replace(/"/g, ""));
        return { email: email || "", name: name || "", status: "pending" };
      }).filter(r => r.email.includes("@"));
      if (parsed.length > 100) return Swal.fire({ icon: "warning", title: "Too many recipients", text: "Maximum 100 per batch." });
      setRecipients(parsed);
      Swal.fire({ icon: "success", title: `${parsed.length} recipients imported`, timer: 1500, showConfirmButton: false });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Paste emails (one per line or comma-separated)
  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    const emails = text.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.includes("@"));
    if (emails.length > 1) {
      e.preventDefault();
      if (emails.length > 100) return Swal.fire({ icon: "warning", title: "Max 100 recipients" });
      setRecipients(emails.map(email => ({ email, name: "", status: "pending" })));
    }
  };

  // ── Full email text with signature ────────────────────────────────────────
  const fullBody = (recipientName) => {
    const greeting = recipientName ? `Hi ${recipientName},\n\n` : "";
    const sig = showSig ? `\n\n${signature}` : "";
    return `${greeting}${body}${sig}`;
  };

  // ── Bulk send ─────────────────────────────────────────────────────────────
  const sendAll = async () => {
    const validRecipients = recipients.filter(r => r.email.trim().includes("@"));
    if (!validRecipients.length || !subject.trim() || !body.trim()) {
      return Swal.fire({ title: "Missing fields", text: "Fill in recipients, subject and body.", icon: "warning" });
    }
    if (!selectedSenders.length) {
      return Swal.fire({ title: "No sender selected", icon: "warning" });
    }

    const confirm = await Swal.fire({
      title: `Send to ${validRecipients.length} recipient(s)?`,
      text: `Using ${selectedSenders.length} sender account(s) with ${delayMs}ms delay between sends.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, send all!",
      confirmButtonColor: "#3b82f6",
    });
    if (!confirm.isConfirmed) return;

    setSending(true);
    setSendLog([]);
    setProgress(0);

    // Reset statuses
    setRecipients(p => p.map(r => ({ ...r, status: r.email.includes("@") ? "pending" : r.status })));

    const log = [];
    let senderIdx = 0;

    for (let i = 0; i < validRecipients.length; i++) {
      const recipient = validRecipients[i];
      const fromEmail = selectedSenders[senderIdx % selectedSenders.length];
      const fromAccount = SENDER_ACCOUNTS.find(a => a.email === fromEmail);

      // Mark as sending
      updateStatus(recipients.indexOf(recipient), "sending");

      try {
        const res = await fetch(`${base_url}/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: fromEmail,
            to: [recipient.email],
            cc: cc ? cc.split(",").map(s => s.trim()) : [],
            bcc: bcc ? bcc.split(",").map(s => s.trim()) : [],
            subject,
            body: fullBody(recipient.name),
            senderName: fromAccount?.name || fromEmail,
          })
        });
        const data = await res.json();
        if (data.success) {
          updateStatus(recipients.indexOf(recipient), "sent");
          log.push({ email: recipient.email, from: fromEmail, status: "sent" });
        } else throw new Error(data.message);
      } catch (err) {
        updateStatus(recipients.indexOf(recipient), "failed");
        log.push({ email: recipient.email, from: fromEmail, status: "failed", error: err.message });
      }

      setSendLog([...log]);
      setProgress(Math.round(((i + 1) / validRecipients.length) * 100));
      senderIdx++;

      // Delay between sends (avoid spam filters)
      if (i < validRecipients.length - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    setSending(false);
    const sent   = log.filter(l => l.status === "sent").length;
    const failed = log.filter(l => l.status === "failed").length;
    Swal.fire({
      icon: failed === 0 ? "success" : "warning",
      title: "Sending complete",
      html: `<b>${sent}</b> sent &nbsp;·&nbsp; <b>${failed}</b> failed`,
    });
  };

  const copyBody = () => {
    navigator.clipboard.writeText(fullBody(""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setRecipients([{ email: "", name: "", status: "pending" }]);
    setSubject(""); setBody(""); setCc(""); setBcc("");
    setSendLog([]); setProgress(0);
  };

  const sentCount   = recipients.filter(r => r.status === "sent").length;
  const failedCount = recipients.filter(r => r.status === "failed").length;
  const validCount  = recipients.filter(r => r.email.trim().includes("@")).length;

  return (
    <div className="w-full p-6 bg-white min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between mb-7 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-medium text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            Email Manager
          </h1>
          <p className="text-sm text-gray-400 font-light mt-0.5">
            Bulk email sending · up to 100 recipients · multiple senders
          </p>
        </div>
        <button onClick={clearAll}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 border border-gray-200 hover:border-red-200 px-3 py-2 rounded-xl transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

        {/* ── LEFT ── */}
        <div className="flex flex-col gap-4">

          {/* Sender selection */}
          <div className={cardCls}>
            <div className={titleCls}>
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              Sender accounts
              <span className="ml-auto text-xs text-gray-400">{selectedSenders.length} selected · rotates between sends</span>
            </div>
            <div className="flex flex-col gap-2">
              {SENDER_ACCOUNTS.map(acc => (
                <label key={acc.email}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSenders.includes(acc.email)
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <input type="checkbox" className="w-4 h-4 accent-blue-500"
                    checked={selectedSenders.includes(acc.email)}
                    onChange={() => toggleSender(acc.email)} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{acc.email}</p>
                    <p className="text-xs text-gray-400">{acc.name}</p>
                  </div>
                  {selectedSenders.includes(acc.email) && (
                    <CheckCircle className="w-4 h-4 text-blue-500 ml-auto" />
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-300 mt-3">
              Add more accounts in cPanel → Email Accounts, then add them to <code className="bg-gray-100 px-1 rounded">SENDER_ACCOUNTS</code> at the top of this file.
            </p>
          </div>

          {/* Recipients */}
          <div className={cardCls}>
            <div className={titleCls}>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2-5 5-5h2M11 9l3 3-3 3"/>
              </svg>
              Recipients
              <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                validCount >= 100 ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
              }`}>
                {validCount} / 100
              </span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors">
                  <Upload className="w-3 h-3" /> Import CSV
                </button>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              Paste multiple emails (comma or line separated) into the first field, or import a CSV with columns: <code className="bg-gray-100 px-1 rounded">email, name</code>
            </p>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 mb-2">
              {["Email address", "Name (optional)", "Status", ""].map(h => (
                <span key={h} className="text-xs text-gray-400 font-medium uppercase tracking-wider">{h}</span>
              ))}
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {recipients.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 items-center">
                  <input className={inp} type="email" placeholder="email@example.com"
                    value={r.email} onPaste={i === 0 ? handlePaste : undefined}
                    onChange={e => updateRecipient(i, "email", e.target.value)} />
                  <input className={inp} type="text" placeholder="First name"
                    value={r.name} onChange={e => updateRecipient(i, "name", e.target.value)} />
                  <StatusBadge status={r.status} />
                  <button type="button" onClick={() => removeRecipient(i)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-300 hover:text-red-400 hover:border-red-200 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addRecipient} disabled={validCount >= 100}
              className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-medium mt-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Plus className="w-3.5 h-3.5" /> Add recipient
            </button>
          </div>

          {/* CC / BCC */}
          <div className={cardCls}>
            <div className={titleCls}>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M2 8h8M2 12h5"/>
              </svg>
              CC / BCC
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CC">
                <input className={inp} type="text" placeholder="cc@example.com"
                  value={cc} onChange={e => setCc(e.target.value)} />
              </Field>
              <Field label="BCC">
                <input className={inp} type="text" placeholder="bcc@example.com"
                  value={bcc} onChange={e => setBcc(e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Subject */}
          <div className={cardCls}>
            <div className={titleCls}>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M2 8h8M2 12h5"/>
              </svg>
              Subject
            </div>
            <Field label="Subject line" required>
              <input className={inp} type="text" placeholder="e.g. Special offer for your business"
                value={subject} onChange={e => setSubject(e.target.value)} />
            </Field>
            <p className="text-xs text-gray-300 mt-2">
              Tip: use <code className="bg-gray-100 px-1 rounded">{"{{name}}"}</code> — personalization is handled automatically via the Name field above.
            </p>
          </div>

          {/* Body */}
          <div className={cardCls}>
            <div className={titleCls}>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 3h12v10H2zM5 6h6M5 9h4"/>
              </svg>
              Email body
              <button onClick={copyBody}
                className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                <Copy className="w-3 h-3" />{copied ? "Copied!" : "Copy"}
              </button>
            </div>
           <Field label="Body" required>
  <RichTextEditor
    value={body}
    onChange={setBody}
    placeholder="Write your email here..."
  />
</Field>
          </div>

          {/* Signature */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-3">
              <div className={`${titleCls} mb-0 pb-0 border-0`}>
                <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 12l4-4 3 3 5-7"/>
                </svg>
                Signature
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-400">Include</span>
                <div className={`w-9 h-5 rounded-full transition-colors relative ${showSig ? "bg-blue-500" : "bg-gray-200"}`}
                  onClick={() => setShowSig(p => !p)}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${showSig ? "left-4" : "left-0.5"}`} />
                </div>
              </label>
            </div>
            {showSig && (
             

                  <RichTextEditor
    value={signature}
    onChange={setSignature}
    placeholder="Write your email here..."
  />
            )}
          </div>

        </div>

        {/* ── RIGHT: Controls ── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">

          {/* Stats */}
          <div className={cardCls}>
            <div className={titleCls}>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
              </svg>
              Batch summary
            </div>
            <div className="flex flex-col gap-0">
              {[
                ["Recipients",  `${validCount}`],
                ["Senders",     `${selectedSenders.length} account(s)`],
                ["Sent",        `${sentCount}`],
                ["Failed",      `${failedCount}`],
                ["Subject",     subject || "—"],
                ["Signature",   showSig ? "included" : "off"],
              ].map(([k, v], i, arr) => (
                <div key={k}>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-gray-400">{k}</span>
                    <span className={`text-xs font-medium max-w-[140px] truncate text-right ${
                      k === "Sent" && sentCount > 0 ? "text-green-600" :
                      k === "Failed" && failedCount > 0 ? "text-red-500" : "text-gray-800"
                    }`}>{v}</span>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-gray-100" />}
                </div>
              ))}
            </div>
          </div>

          {/* Send delay */}
          <div className={cardCls}>
            <div className={titleCls}>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
              </svg>
              Send delay
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "Fast (0.5s)",   val: 500 },
                { label: "Normal (1s)",   val: 1000 },
                { label: "Safe (2s)",     val: 2000 },
                { label: "Slow (3s)",     val: 3000 },
              ].map(opt => (
                <label key={opt.val}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                    delayMs === opt.val ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <input type="radio" className="accent-blue-500" name="delay"
                    checked={delayMs === opt.val} onChange={() => setDelayMs(opt.val)} />
                  <span className="text-xs text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-300 mt-2">Slower = less likely to hit spam filters</p>
          </div>

          {/* Progress bar */}
          {sending && (
            <div className={cardCls}>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-500 font-medium">Sending...</span>
                <span className="text-blue-500 font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {sentCount + failedCount} / {validCount} processed
              </p>
            </div>
          )}

          {/* Send button */}
          <button onClick={sendAll} disabled={sending || !validCount || !subject.trim() || !body.trim()}
            className="w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600
              disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
              text-white text-sm font-medium flex items-center justify-center gap-2
              transition-all hover:-translate-y-px active:translate-y-0"
            style={{ boxShadow: (!sending && validCount && subject.trim() && body.trim()) ? "0 4px 12px rgba(59,130,246,0.25)" : "none" }}>
            {sending ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending {sentCount + failedCount}/{validCount}...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to {validCount} recipient{validCount !== 1 ? "s" : ""}
              </>
            )}
          </button>

          <p className="text-xs text-gray-300 text-center -mt-2">
            {!validCount ? "Add recipients to enable" :
             !subject.trim() ? "Add a subject to enable" :
             !body.trim() ? "Write your email to enable" :
             `Ready · ${selectedSenders.length} sender(s) · ${delayMs}ms delay`}
          </p>

          {/* Send log */}
          {sendLog.length > 0 && (
            <div className={cardCls}>
              <div className={titleCls}>
                <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h12M2 8h8M2 12h5"/>
                </svg>
                Send log
                <span className="ml-auto text-xs text-gray-400">{sendLog.length} entries</span>
              </div>
              <ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {sendLog.map((l, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    {l.status === "sent"
                      ? <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      : <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                    <span className="text-gray-600 truncate flex-1">{l.email}</span>
                    <span className="text-gray-300 flex-shrink-0 text-xs truncate max-w-[80px]">{l.from.split("@")[0]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EmailManager;