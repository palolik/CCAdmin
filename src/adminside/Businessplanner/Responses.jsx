import { useEffect, useMemo, useState } from "react";
import { base_url } from "../../config/config";
import { ShimmerTable } from "../../userside/utils/Shimmer.jsx";

const ALL = "all";
const DELETED = "deleted";

const TYPE_LABELS = {
  text: "Short answer",
  paragraph: "Paragraph",
  number: "Number",
  mcq: "Single choice",
  checkbox: "Multiple choice",
};

const isEmpty = (answer) =>
  answer === undefined ||
  answer === null ||
  answer === "" ||
  (Array.isArray(answer) && answer.length === 0);

const answerToText = (answer) => {
  if (isEmpty(answer)) return "";
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "object") return JSON.stringify(answer);
  return String(answer);
};

// A conditional question is only shown when its parent question has a specific answer.
const wasAsked = (q, questions) => {
  if (!q.condition?.questionId) return true;
  const parent = questions.find((p) => p.id === q.condition.questionId);
  return parent?.answer === q.condition.value;
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Unknown date";

const timeAgo = (value) => {
  if (!value) return "";
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(value).toLocaleDateString();
};

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const Responses = () => {
  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeForm, setActiveForm] = useState(ALL);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showSkipped, setShowSkipped] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${base_url}/getans`).then((r) => r.json()),
      fetch(`${base_url}/getque`).then((r) => r.json()).catch(() => []),
    ])
      .then(([ans, que]) => {
        setResponses(Array.isArray(ans) ? ans : []);
        setForms(Array.isArray(que) ? que : []);
      })
      .catch(() => setError("Could not load responses."))
      .finally(() => setLoading(false));
  }, []);

  const formTitle = useMemo(() => {
    const map = {};
    forms.forEach((f) => (map[f._id] = f.title));
    return map;
  }, [forms]);

  // Newest first; numbered per form in submission order (#1 = first submission of that form).
  const enriched = useMemo(() => {
    const sorted = [...responses].sort(
      (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
    );
    const counters = {};
    return sorted
      .map((r) => {
        const group = formTitle[r.formId] ? r.formId : DELETED;
        counters[group] = (counters[group] || 0) + 1;
        const questions = r.questions || [];
        const asked = questions.filter((q) => wasAsked(q, questions));
        const answered = asked.filter((q) => !isEmpty(q.answer));
        return {
          ...r,
          group,
          title: formTitle[r.formId] || "Deleted form",
          number: counters[group],
          asked,
          answered,
        };
      })
      .reverse();
  }, [responses, formTitle]);

  const formTabs = useMemo(() => {
    const counts = {};
    enriched.forEach((r) => (counts[r.group] = (counts[r.group] || 0) + 1));
    const tabs = forms
      .filter((f) => counts[f._id])
      .map((f) => ({ id: f._id, title: f.title, count: counts[f._id] }));
    if (counts[DELETED]) tabs.push({ id: DELETED, title: "Deleted forms", count: counts[DELETED] });
    return tabs;
  }, [enriched, forms]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enriched.filter((r) => {
      if (activeForm !== ALL && r.group !== activeForm) return false;
      if (!term) return true;
      return (r.questions || []).some(
        (q) =>
          answerToText(q.answer).toLowerCase().includes(term) ||
          (q.label || "").toLowerCase().includes(term)
      );
    });
  }, [enriched, activeForm, search]);

  const selected = visible.find((r) => r._id === selectedId) || null;

  const selectResponse = (id) => {
    setSelectedId(id);
    setShowSkipped(false);
  };

  const exportCsv = () => {
    const labels = [
      ...new Set(visible.flatMap((r) => (r.questions || []).map((q) => q.label))),
    ];
    const header = ["Form", "Response #", "Submitted at", ...labels];
    const rows = visible.map((r) => [
      r.title,
      r.number,
      formatDate(r.submittedAt),
      ...labels.map((label) =>
        answerToText((r.questions || []).find((q) => q.label === label)?.answer)
      ),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name =
      activeForm === ALL
        ? "all-forms"
        : formTabs.find((t) => t.id === activeForm)?.title || "form";
    a.download = `responses-${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="hdr">Responses</div>
        <div className="p-6">
          <ShimmerTable rows={6} cols={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-ink-50">
      <div className="hdr">Responses</div>

      <div className="p-4 md:p-6 flex flex-col gap-4">
        {/* Summary + toolbar */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="text-sm text-ink-500">
              Answers people submitted through your Business Planner forms.
            </p>
            <p className="text-ink-900 font-medium mt-1">
              {responses.length} response{responses.length === 1 ? "" : "s"} across{" "}
              {formTabs.length} form{formTabs.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search answers…"
              className="w-full md:w-64 border border-ink-200 bg-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <button
              type="button"
              onClick={exportCsv}
              disabled={visible.length === 0}
              className="btn-cc-secondary shrink-0 disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Form filter */}
        {formTabs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {[{ id: ALL, title: "All forms", count: responses.length }, ...formTabs].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveForm(t.id);
                  setSelectedId(null);
                }}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  activeForm === t.id
                    ? "bg-ink-900 text-white border-ink-900"
                    : "bg-white text-ink-700 border-ink-200 hover:border-ink-400"
                }`}
              >
                {t.title}
                <span
                  className={`ml-2 text-xs ${activeForm === t.id ? "text-ink-300" : "text-ink-400"}`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-danger-600 text-sm">{error}</p>}

        {responses.length === 0 && !error ? (
          <div className="bg-white border border-ink-200 rounded-2xl p-10 text-center">
            <p className="text-ink-900 font-medium">No responses yet</p>
            <p className="text-sm text-ink-500 mt-1">
              When someone fills in one of your planner forms, their answers will show up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">
            {/* Submission list (hidden on small screens while reading one) */}
            <div
              className={`bg-white border border-ink-200 rounded-2xl overflow-hidden ${
                selected ? "hidden lg:block" : ""
              }`}
            >
              <div className="px-4 py-3 border-b border-ink-100 text-xs uppercase tracking-wider text-ink-500">
                {visible.length} submission{visible.length === 1 ? "" : "s"}
              </div>
              {visible.length === 0 ? (
                <p className="p-6 text-sm text-ink-500 text-center">No responses match.</p>
              ) : (
                <ul className="max-h-[70vh] overflow-y-auto divide-y divide-ink-100">
                  {visible.map((r) => {
                    const preview =
                      r.answered.find((q) => q.type === "text" || q.type === "paragraph") ||
                      r.answered[0];
                    const active = selected?._id === r._id;
                    return (
                      <li key={r._id}>
                        <button
                          type="button"
                          onClick={() => selectResponse(r._id)}
                          className={`w-full text-left px-4 py-3 border-l-4 transition-colors ${
                            active ? "bg-brand-50 border-brand-500" : "border-transparent hover:bg-ink-50"
                          }`}
                        >
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="font-medium text-ink-900 text-sm truncate">
                              {r.title} <span className="text-ink-400">#{r.number}</span>
                            </span>
                            <span className="text-xs text-ink-400 shrink-0">
                              {timeAgo(r.submittedAt)}
                            </span>
                          </div>
                          {preview ? (
                            <p className="text-sm text-ink-600 mt-1 truncate">
                              <span className="text-ink-400">{preview.label}: </span>
                              {answerToText(preview.answer)}
                            </p>
                          ) : (
                            <p className="text-sm text-ink-400 mt-1 italic">No answers given</p>
                          )}
                          <p className="text-xs text-ink-400 mt-1">
                            {r.answered.length} of {r.asked.length} questions answered
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Detail */}
            <div className={selected ? "" : "hidden lg:block"}>
              {selected ? (
                <ResponseDetail
                  response={selected}
                  showSkipped={showSkipped}
                  onToggleSkipped={() => setShowSkipped((s) => !s)}
                  onBack={() => setSelectedId(null)}
                />
              ) : (
                <div className="bg-white border border-dashed border-ink-300 rounded-2xl p-10 text-center text-ink-500 text-sm">
                  Select a submission on the left to read the answers.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AnswerValue = ({ question }) => {
  const { answer, type } = question;
  if (isEmpty(answer)) {
    return <p className="text-sm text-ink-400 italic">No answer</p>;
  }
  if (Array.isArray(answer) || type === "mcq") {
    const items = Array.isArray(answer) ? answer : [answer];
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((a) => (
          <span key={a} className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-sm">
            {answerToText(a)}
          </span>
        ))}
      </div>
    );
  }
  return (
    <p className="text-sm text-ink-900 whitespace-pre-wrap break-words">{answerToText(answer)}</p>
  );
};

const ResponseDetail = ({ response, showSkipped, onToggleSkipped, onBack }) => {
  const questions = response.questions || [];
  const skipped = questions.filter((q) => !wasAsked(q, questions));

  const renderQuestion = (q, i, muted = false) => (
    <li key={q.id || i} className={`px-5 py-4 ${muted ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="text-sm font-medium text-ink-700">
          <span className="text-ink-400 mr-1.5">{i + 1}.</span>
          {q.label || "Untitled question"}
        </p>
        {TYPE_LABELS[q.type] && (
          <span className="text-[11px] text-ink-400 shrink-0">{TYPE_LABELS[q.type]}</span>
        )}
      </div>
      <div className="pl-5">
        <AnswerValue question={q} />
      </div>
    </li>
  );

  return (
    <div className="bg-white border border-ink-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100">
        <button type="button" onClick={onBack} className="lg:hidden text-sm text-brand-600 mb-2">
          ← All submissions
        </button>
        <h2 className="text-lg font-semibold text-ink-900">
          {response.title}{" "}
          <span className="text-ink-400 font-normal">· Response #{response.number}</span>
        </h2>
        <p className="text-sm text-ink-500 mt-0.5">
          Submitted {formatDate(response.submittedAt)} · {response.answered.length} of{" "}
          {response.asked.length} questions answered
        </p>
      </div>

      <ol className="divide-y divide-ink-100">
        {response.asked.map((q, i) => renderQuestion(q, i))}
      </ol>

      {skipped.length > 0 && (
        <div className="border-t border-ink-100">
          <button
            type="button"
            onClick={onToggleSkipped}
            className="w-full text-left px-5 py-3 text-sm text-ink-500 hover:bg-ink-50"
          >
            {showSkipped ? "Hide" : "Show"} {skipped.length} question
            {skipped.length === 1 ? "" : "s"} not asked (skipped by form logic)
          </button>
          {showSkipped && (
            <ol className="divide-y divide-ink-100 bg-ink-50">
              {skipped.map((q, i) => renderQuestion(q, i, true))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
};

export default Responses;
