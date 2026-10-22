import { useState } from "react";
import { FiSend } from "react-icons/fi";
import RichTextEditor from "../../userside/utils/PichTextEditor";
import MailModal from "./MailModal";
import { errorMessage, useSubmitGuard } from "./mailApi";
import { MAX_RECIPIENTS, absoluteUrls, hasBody, splitAddresses, toastError, toastSuccess } from "./mailUtils";

const empty = { from: "", senderName: "", to: "", cc: "", bcc: "", subject: "", html: "" };

// `initial` prefills the form (reply); `onSettled` runs after a send that was logged (sent or failed).
export default function MailCompose({ api, mailboxes, initial, onClose, onSettled }) {
  const [base] = useState(() => {
    const defaultBox = mailboxes.find((b) => b.key === initial?.from && b.configured)
      || mailboxes.find((b) => b.key === "support" && b.configured)
      || mailboxes.find((b) => b.configured)
      || mailboxes[0];
    return { ...empty, ...initial, from: defaultBox?.key || "" };
  });
  const [form, setForm] = useState(base);
  const [showCopies, setShowCopies] = useState(false);
  const [separately, setSeparately] = useState(false);
  const [submitting, guard] = useSubmitGuard();

  const dirty = Object.keys(empty).some((key) => form[key] !== base[key]);
  const field = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });
  const selected = mailboxes.find((b) => b.key === form.from);

  const handleSubmit = (e) => {
    e.preventDefault();
    guard(async () => {
      const to = splitAddresses(form.to);
      const cc = splitAddresses(form.cc);
      const bcc = splitAddresses(form.bcc);
      if (!to.length) return toastError("Add at least one recipient.");
      if (to.length + cc.length + bcc.length > MAX_RECIPIENTS) return toastError(`At most ${MAX_RECIPIENTS} recipients per email (to, cc and bcc combined).`);
      if (!hasBody(form.html)) return toastError("Write a message first.");
      if (!selected?.configured) return toastError("The selected mailbox is not configured on the server.");

      const payload = { from: form.from, to, subject: form.subject.trim(), html: absoluteUrls(form.html) };
      if (cc.length) payload.cc = cc;
      if (bcc.length) payload.bcc = bcc;
      if (form.senderName.trim()) payload.senderName = form.senderName.trim();

      // One email per "To" address, so recipients don't see each other (the old bulk sender).
      if (separately && to.length > 1) {
        let failed = 0;
        for (const addr of to) {
          const res = await api("/mail/send", "POST", { ...payload, to: [addr] });
          if (res.status === 401) return;
          if (!res.success) failed++;
        }
        onSettled?.();
        if (failed) return toastError(`${failed} of ${to.length} emails failed. See Sent for details.`);
        toastSuccess(`${to.length} emails sent`);
        onClose();
        return;
      }

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
    });
  };

  return (
    <MailModal title={initial?.subject ? "Reply" : "Compose email"} onClose={onClose} dirty={dirty} busy={submitting}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
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
          <div>
            <label className="mlabel" htmlFor="mail-sender">Sender name (optional)</label>
            <input id="mail-sender" className="minput" maxLength={100} placeholder={selected?.name || ""} {...field("senderName")} />
          </div>
        </div>
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
        </div>
        {(showCopies || form.cc || form.bcc) && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="mlabel" htmlFor="mail-cc">Cc</label>
              <input id="mail-cc" className="minput" {...field("cc")} />
            </div>
            <div>
              <label className="mlabel" htmlFor="mail-bcc">Bcc</label>
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
          <RichTextEditor
            value={base.html}
            onChange={(html) => setForm((f) => ({ ...f, html }))}
            placeholder="Write your message..."
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input type="checkbox" className="checkbox checkbox-sm" checked={separately} onChange={(e) => setSeparately(e.target.checked)} />
          Send separately to each &quot;To&quot; address
        </label>
        <p className="text-xs text-gray-500">Up to {MAX_RECIPIENTS} recipients in total. Separate addresses with commas.</p>
        <div className="flex justify-end">
          <button type="submit" className="mbtn mbtn-gradient" disabled={submitting} aria-busy={submitting}>
            {submitting ? <span className="loading loading-spinner loading-xs" /> : <FiSend className="w-4 h-4" />}
            {submitting ? "Sending…" : separately && splitAddresses(form.to).length > 1 ? `Send ${splitAddresses(form.to).length} emails` : "Send"}
          </button>
        </div>
      </form>
    </MailModal>
  );
}

