import React, { useState } from "react";
import Swal from "sweetalert2";
import { base_url } from "../../config/config";
const Planner = () => {
  const [plannerTitle, setPlannerTitle] = useState("");
  const [questions, setQuestions] = useState([]);

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
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [key]: value } : q))
    );
  };

  const addOption = (id) => {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? { ...q, options: [...q.options, { id: Date.now(), value: "" }] }
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
          ? { ...q, options: q.options.filter((o) => o.id !== optId) }
          : q
      )
    );
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const saveQuestions = async () => {
    if (!plannerTitle.trim()) {
      return Swal.fire("Error!", "Planner title is required!", "error");
    }

    if (questions.length === 0) {
      return Swal.fire("Error!", "Add at least 1 question!", "error");
    }

    try {
      const res = await fetch(`${base_url}/addplanner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: plannerTitle,
          questions: questions,
        }),
      });

      const data = await res.json();

      if (data.insertedId) {
        Swal.fire("Saved!", "Planner saved successfully!", "success");
        setPlannerTitle("");
        setQuestions([]);
      } else {
        Swal.fire("Error!", "Saving failed!", "error");
      }
    } catch (err) {
      Swal.fire("Error!", "Unexpected server error!", "error");
    }
  };

  return (
     <div className="w-full">
            <div className="hdr">Plan maker</div>

      <input
        type="text"
        placeholder="Planner Title"
        value={plannerTitle}
        onChange={(e) => setPlannerTitle(e.target.value)}
        className="w-full p-3 border rounded mb-5 text-lg font-medium"
      />

      <button
        onClick={addQuestion}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-5"
      >
        + Add Question
      </button>

      <div className="space-y-5">
        {questions.map((q, index) => (
          <div key={q.id} className="p-4 border rounded-lg bg-white shadow">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-700">
                Question {index + 1}
              </h3>
              <button
                onClick={() => removeQuestion(q.id)}
                className="text-red-500 font-semibold"
              >
                Delete
              </button>
            </div>

            <input
              type="text"
              placeholder="Question text"
              value={q.title}
              onChange={(e) =>
                updateQuestion(q.id, "title", e.target.value)
              }
              className="w-full p-2 border rounded mb-3"
            />

            <select
              value={q.type}
              onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
              className="p-2 border rounded mb-3"
            >
              <option value="short">Short Answer</option>
              <option value="paragraph">Paragraph</option>
              <option value="mcq">Multiple Choice</option>
              <option value="checkbox">Checkboxes</option>
            </select>

            {(q.type === "mcq" || q.type === "checkbox") && (
              <div className="ml-4 mb-3 space-y-2">
                {q.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.value}
                      onChange={(e) =>
                        updateOption(q.id, opt.id, e.target.value)
                      }
                      placeholder="Option"
                      className="p-2 border rounded w-full"
                    />
                    <button
                      onClick={() => removeOption(q.id, opt.id)}
                      className="text-red-500"
                    >
                      ✖
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addOption(q.id)}
                  className="text-blue-600"
                >
                  + Add Option
                </button>
              </div>
            )}

            <div className="mt-4 border-t pt-3">
              <h4 className="font-medium text-gray-700">
                Conditional Logic
              </h4>

              <select
                className="p-2 border rounded mt-2 w-full"
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
                  .filter((prevQ) => prevQ.id !== q.id)
                  .map((prevQ) => (
                    <option key={prevQ.id} value={prevQ.id}>
                      If answer to: {prevQ.title || "Untitled"}
                    </option>
                  ))}
              </select>

              {q.condition.questionId && (
                <input
                  type="text"
                  className="p-2 border rounded mt-2 w-full"
                  placeholder="Show only if answer equals..."
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
        onClick={saveQuestions}
        className="mt-6 px-6 py-3 bg-green-600 text-white rounded shadow"
      >
        Save Planner
      </button>
    </div>
  );
};

export default Planner;
