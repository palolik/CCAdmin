import Swal from "sweetalert2";
import { base_url } from "../../config/config";

export const MAX_RECIPIENTS = 50;
export const FOLDERS = ["inbox", "sent"];
export const MAIL_PATH = "/admin/mail";

// Rich-text images may be relative /uploads/... paths; an email needs absolute URLs.
const uploadsOrigin = String(base_url || "").replace(/\/+$/, "");

export const when = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";
};

export const toList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export const splitAddresses = (str) => String(str || "").split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

export const escapeHtml = (str) =>
  String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// True when the editor HTML has visible content (text or an image).
export const hasBody = (html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html || "";
  return Boolean(tpl.content.textContent.trim() || tpl.content.querySelector("img"));
};

// Resolves relative image/link URLs against the backend origin. A <template> parses without
// loading images or running anything.
export const absoluteUrls = (html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html || "";
  const fix = (el, attr) => {
    const value = el.getAttribute(attr);
    if (!value || /^(data:|https?:|cid:|mailto:|tel:|#)/i.test(value)) return;
    try {
      el.setAttribute(attr, new URL(value, `${uploadsOrigin}/`).href);
    } catch {
      // leave unparsable URLs as they are
    }
  };
  tpl.content.querySelectorAll("img[src]").forEach((el) => fix(el, "src"));
  tpl.content.querySelectorAll("a[href]").forEach((el) => fix(el, "href"));
  return tpl.innerHTML;
};

// Email HTML can come from any outside sender. It is only ever shown inside an iframe with
// sandbox="" (no scripts, opaque origin, no forms/popups); the CSP below additionally blocks
// scripts, frames, forms and external stylesheets. Plain-text emails are escaped into a <pre>.
const CSP = "default-src 'none'; img-src data: https: http:; style-src 'unsafe-inline'; font-src data: https:";

export const emailDocument = (email) => {
  const body = email?.html
    ? email.html
    : `<pre style="white-space:pre-wrap;font-family:inherit;margin:0">${escapeHtml(email?.text || "")}</pre>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><style>body{font-family:system-ui,sans-serif;font-size:14px;color:#1f2937;background:#fff;margin:16px;word-wrap:break-word}img{max-width:100%;height:auto}</style></head><body>${body}</body></html>`;
};

// Composer values for replying to an email.
export const replyForm = (email, mailboxes) => {
  const box = mailboxes.find((b) => b.address === email.mailbox);
  const to = email.type === "inbox" ? email.from : toList(email.to).join(", ");
  const subject = /^re:/i.test(email.subject || "") ? email.subject : `Re: ${email.subject || ""}`.trim();
  const quoted = email.text
    ? `<p><br></p><p>On ${escapeHtml(when(email.date))}, ${escapeHtml(email.senderName || email.from)} wrote:</p><blockquote>${escapeHtml(email.text).replace(/\n/g, "<br>")}</blockquote>`
    : "";
  return { from: box?.key || "", to: to || "", subject, html: quoted };
};

// Dialogs, in the admin's indigo accent.
export const toastSuccess = (title) => {
  Swal.fire({ icon: "success", title, timer: 1500, showConfirmButton: false });
};

export const toastError = (text) => {
  Swal.fire({ icon: "error", title: "Error", text, confirmButtonColor: "#4f46e5" });
};

// Resolves true only when the confirm button is clicked.
export const confirmAction = ({ title = "Are you sure?", text, confirmText = "Yes, continue", cancelText = "Cancel", danger = true, focusCancel = false } = {}) =>
  Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    focusCancel,
    confirmButtonColor: danger ? "#ef4444" : "#4f46e5",
    cancelButtonColor: "#14b8a6",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  }).then((result) => result.isConfirmed);
