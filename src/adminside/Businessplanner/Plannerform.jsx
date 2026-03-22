import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { base_url } from "../../config/config";

const FormPage = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch(`${base_url}/getque/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const mappedQuestions = data.questions.map((q) => ({
          id: q.id,
          label: q.title,
          type: q.type,
          options: (q.options || []).map((o) => o.value),
          condition: q.condition || null,
        }));

        setForm({ ...data, questions: mappedQuestions });

        const initialAnswers = {};
        data.questions.forEach((q) => (initialAnswers[q.id] = ""));
        setAnswers(initialAnswers);
      });
  }, [id]);

  const handleChange = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const isVisible = (q) => {
    if (!q.condition || !q.condition.questionId) return true;
    return answers[q.condition.questionId] === q.condition.value;
  };

  const visibleQuestions = form?.questions.filter(isVisible) || [];
  const currentQuestion = visibleQuestions[currentIndex];

  const handleSubmit = async () => {
    const payload = { formId: id, answers };

    const res = await fetch(`${base_url}/submitanswers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(data.success ? "Form submitted successfully!" : "Failed to submit form.");
  };

  const progress = ((currentIndex + 1) / visibleQuestions.length) * 100;

  if (!form) return <div className="flex justify-center p-10 text-lg font-medium">Loading...</div>;

  return (
     <div className="w-full">
            <div className="hdr">Demo form</div>
      <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-700 mb-6">
          {currentQuestion?.label}
        </h1>

        {currentQuestion?.type === "text" && (
          <input
            type="text"
            className="border p-3 rounded w-full text-center"
            value={answers[currentQuestion.id]}
            onChange={(e) => handleChange(currentQuestion.id, e.target.value)}
          />
        )}

        {currentQuestion?.type === "paragraph" && (
          <textarea
            className="border p-3 rounded w-full h-32"
            value={answers[currentQuestion.id]}
            onChange={(e) => handleChange(currentQuestion.id, e.target.value)}
          />
        )}

        {currentQuestion?.type === "number" && (
          <input
            type="number"
            className="border p-3 rounded w-full"
            value={answers[currentQuestion.id]}
            onChange={(e) => handleChange(currentQuestion.id, e.target.value)}
          />
        )}

        {(currentQuestion?.type === "mcq" ||
          currentQuestion?.type === "checkbox") && (
          <div className="flex flex-col gap-3 mt-4">
            {currentQuestion.options.map((op) => (
              <label key={op} className="flex items-center justify-center gap-3 cursor-pointer">
                <input
                  type={currentQuestion.type === "mcq" ? "radio" : "checkbox"}
                  name={currentQuestion.id}
                  checked={
                    currentQuestion.type === "mcq"
                      ? answers[currentQuestion.id] === op
                      : answers[currentQuestion.id]?.includes(op)
                  }
                  value={op}
                  onChange={(e) => {
                    const prev = answers[currentQuestion.id] || [];
                    if (currentQuestion.type === "mcq") {
                      handleChange(currentQuestion.id, e.target.value);
                    } else {
                      handleChange(
                        currentQuestion.id,
                        e.target.checked
                          ? [...prev, op]
                          : prev.filter((v) => v !== op)
                      );
                    }
                  }}
                />
                {op}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-10 max-w-xl mx-auto w-full">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>

        {currentIndex < visibleQuestions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-600 text-white rounded-lg"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default FormPage;
