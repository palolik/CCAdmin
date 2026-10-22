import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { confirmAction } from "./mailUtils";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

// Full-screen on phones, centred card from `sm` up. Focus moves into the dialog on open, Tab
// cycles inside it, Esc closes it and focus returns to the opener on close.
// Esc and × do nothing while `busy` and ask before discarding a `dirty` form.
export default function MailModal({ title, onClose, children, dirty = false, busy = false }) {
  const dialogRef = useRef(null);
  const confirming = useRef(false);

  const requestClose = async () => {
    if (busy || confirming.current) return;
    if (dirty) {
      confirming.current = true;
      try {
        const ok = await confirmAction({
          title: "Discard changes?",
          text: "Your unsaved changes will be lost.",
          confirmText: "Discard",
          cancelText: "Keep editing",
          focusCancel: true,
        });
        if (!ok) return;
      } finally {
        confirming.current = false;
      }
    }
    onClose();
  };

  useEffect(() => {
    const opener = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      requestClose();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/60 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="bg-white text-gray-800 border border-gray-200 shadow-xl w-full sm:max-w-3xl max-h-dvh sm:max-h-[90vh] rounded-none sm:rounded-2xl flex flex-col outline-none"
      >
        <div className="flex justify-between items-center gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 min-w-0 break-words">{title}</h2>
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            aria-label="Close"
            className="p-1 rounded-md text-gray-400 hover:text-indigo-600 disabled:opacity-50"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

