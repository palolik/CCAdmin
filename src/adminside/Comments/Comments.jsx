import { useEffect, useState } from "react";
import { base_url } from '../../config/config';
const PComments = () => {
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState({});
  const ordersPerPage = 7;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchComments = async () => {
    const res = await fetch(`${base_url}/allcomments`);
    const data = await res.json();
    setComments(data);
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // Pagination
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = comments.slice(startIndex, endIndex);
  const totalPages = Math.ceil(comments.length / ordersPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Hide / Show
  const toggleStatus = async (id, status) => {
    await fetch(`${base_url}/commentstatus/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: status === "show" ? "hide" : "show",
      }),
    });
    fetchComments();
  };

  // Admin Reply
  const submitReply = async (commentId) => {
    if (!replyText[commentId]) return;

    await fetch(`${base_url}/replycomment/${commentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: "Pripack",
        message: replyText[commentId],
      }),
    });

    setReplyText((prev) => ({ ...prev, [commentId]: "" }));
    fetchComments();
  };

  return (
    <div className="w-full ">
      <div className='headr'>All Comments</div>

      {currentOrders.map((comment) => (
        <div
          key={comment._id}
          className="bg-white m-4 rounded-lg shadow-sm border p-4 mb-4"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Product ID: <span className="font-normal">{comment.productId}</span>
              </p>
              <p className="text-xs text-gray-500">
                Comment ID: {comment._id.toString().slice(-6)}
              </p>
            </div>

            <button
              onClick={() => toggleStatus(comment._id, comment.status)}
              className={`px-3 py-1 text-xs rounded ${
                comment.status === "show"
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {comment.status === "show" ? "Hide" : "Show"}
            </button>
          </div>

          {/* Comment Text */}
          <p className="text-gray-700 text-sm mb-3">
            {comment.message}
          </p>

          {/* Replies */}
          {comment.replies?.length > 0 && (
            <div className="border-l-2 border-gray-200 pl-4 space-y-2 mb-3">
              {comment.replies.map((r) => (
                <div
                  key={r._id}
                  className="bg-gray-50 p-2 rounded"
                >
                  <p className="text-xs font-semibold text-gray-700">
                    {r.userName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {r.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Reply Box */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Reply as admin..."
              value={replyText[comment._id] || ""}
              onChange={(e) =>
                setReplyText({
                  ...replyText,
                  [comment._id]: e.target.value,
                })
              }
              className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <button
              onClick={() => submitReply(comment._id)}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
            >
              Reply
            </button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Previous
        </button>

        <span className="text-sm font-semibold">{currentPage}</span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PComments;
