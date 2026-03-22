import React, { useEffect, useState } from "react";
import { base_url } from "../../config/config";

const Responses = () => {
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    fetch(`${base_url}/getans`)
      .then((res) => res.json())
      .then((data) => setResponses(data))
      .catch((err) => console.error(err));
  }, []);

  if (responses.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600">
        No responses found...
      </div>
    );
  }

  const allQuestions = [
    ...new Set(
      responses.flatMap((resp) => resp.questions.map((q) => q.label))
    ),
  ];

  return (
      <div className="w-full">
            <div className="hdr">Response Table</div>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full border-collapse">
          <thead className="bg-black text-white">
            <tr>
              <th className="border px-4 py-2 text-left">#</th>
              {allQuestions.map((label, idx) => (
                <th key={idx} className="border px-4 py-2 text-left">
                  {label}
                </th>
              ))}
              <th className="border px-4 py-2 text-left">Submitted At</th>
            </tr>
          </thead>

          <tbody>
            {responses.map((resp, rowIndex) => (
              <tr
                key={resp._id}
                className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition"
              >
                <td className="border px-4 py-2 font-semibold">
                  {rowIndex + 1}
                </td>

                {allQuestions.map((label, colIndex) => {
                  const q = resp.questions.find((x) => x.label === label);
                  return (
                    <td
                      key={colIndex}
                      className="border px-4 py-2 text-gray-800"
                    >
                      {q?.answer || "—"}
                    </td>
                  );
                })}

                <td className="border px-4 py-2 text-gray-600 text-sm">
                  {new Date(resp.submittedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Responses;
