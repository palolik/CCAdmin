import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";

const EditPlanner = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizeQuestions = (dataQuestions) => {
    return dataQuestions.map((q) => ({
      id: q.id,
      title: q.title || "",
      type: q.type || "short",
      options: Array.isArray(q.options)
        ? q.options.map((o) => ({
            id: o.id || Date.now() + Math.random(),
            value: o.value || "",
          }))
        : [],
      condition: q.condition || { questionId: "", value: "" },
    }));
  };

  const loadPlanner = async () => {
    try {
      const res = await fetch(`${base_url}/getque/${id}`);
      const data = await res.json();

      setTitle(data.title);
      setQuestions(normalizeQuestions(data.questions));
      setLoading(false);
    } catch (err) {
      Swal.fire("Error!", "Unable to load planner", "error");
    }
  };

  useEffect(() => {
    loadPlanner();
  }, []);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        title: "",
        type: "short",
        options: [],
        condition: { questionId: "", value: "" },
      },
    ]);
  };

  const updateQuestion = (id, key, value) => {
    setQuestions(questions.map((q) =>
      q.id === id ? { ...q, [key]: value } : q
    ));
  };

  const addOption = (qId) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: [...q.options, { id: Date.now(), value: "" }],
            }
          : q
      )
    );
  };

  const updateOption = (qId, optId, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o) =>
                o.id === optId ? { ...o, value } : o
              ),
            }
          : q
      )
    );
  };

  const removeOption = (qId, optId) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.filter((o) => o.id !== optId),
            }
          : q
      )
    );
  };

  const removeQuestion = (qId) =>
    setQuestions(questions.filter((q) => q.id !== qId));

  const savePlanner = async () => {
    try {
      const res = await fetch(`${base_url}/planner/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, questions }),
      });

      const data = await res.json();

      if (data.modifiedCount > 0) {
        Swal.fire("Updated!", "Planner updated successfully!", "success");
        navigate("/admin/planslist");
      } else {
        Swal.fire("No Changes", "Nothing was updated", "info");
      }
    } catch (err) {
      Swal.fire("Error!", "Update failed", "error");
    }
  };

  if (loading) return <div className="p-5">Loading...</div>;

  return (
    <div className="p-6 w-full">
      <h2 className="text-2xl font-bold mb-4">Edit Planner</h2>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="p-2 border rounded w-full mb-5"
      />

      <button
        onClick={addQuestion}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-5"
      >
        + Add Question
      </button>

      <div className="space-y-5">
        {questions.map((q, index) => (
          <div key={q.id} className="p-4 border rounded bg-white shadow">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Question {index + 1}</h3>
              <button className="text-red-600" onClick={() => removeQuestion(q.id)}>Delete</button>
            </div>

            <input
              type="text"
              value={q.title}
              placeholder="Question text"
              onChange={(e) => updateQuestion(q.id, "title", e.target.value)}
              className="p-2 border rounded w-full mb-3"
            />

            <select
              value={q.type}
              onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
              className="p-2 border rounded mb-3"
            >
              <option value="short">Short</option>
              <option value="paragraph">Paragraph</option>
              <option value="mcq">MCQ</option>
              <option value="checkbox">Checkbox</option>
            </select>

            {(q.type === "mcq" || q.type === "checkbox") && (
              <div className="ml-4 space-y-2 mb-4">
                {q.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="p-2 border rounded w-full"
                      value={opt.value}
                      onChange={(e) =>
                        updateOption(q.id, opt.id, e.target.value)
                      }
                    />
                    <button className="text-red-500" onClick={() => removeOption(q.id, opt.id)}>✖</button>
                  </div>
                ))}
                <button className="text-blue-600" onClick={() => addOption(q.id)}>
                  + Add Option
                </button>
              </div>
            )}

            <div className="border-t pt-3">
              <h4 className="font-semibold">Conditional Logic</h4>
              <select
                className="p-2 border rounded w-full mt-2"
                value={q.condition.questionId}
                onChange={(e) =>
                  updateQuestion(q.id, "condition", {
                    ...q.condition,
                    questionId: e.target.value,
                  })
                }
              >
                <option value="">Always show</option>
                {questions
                  .filter((x) => x.id !== q.id)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      If answer to: {x.title || "Untitled"}
                    </option>
                  ))}
              </select>

              {q.condition.questionId && (
                <input
                  type="text"
                  placeholder="Value required"
                  className="p-2 border rounded w-full mt-2"
                  value={q.condition.value}
                  onChange={(e) =>
                    updateQuestion(q.id, "condition", {
                      ...q.condition,
                      value: e.target.value,
                    })
                  }
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={savePlanner}
        className="mt-6 px-6 py-3 bg-green-600 text-white rounded"
      >
        Save Changes
      </button>
    </div>
  );
};

export default EditPlanner;
