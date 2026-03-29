import { useEffect, useState } from "react";
import { MdChat, MdAccessTime, MdBusiness, MdMessage } from "react-icons/md";
import Schat from "./Schat";
import { base_url } from "../../config/config";

const AdminSupport = () => {
  const [supports, setSupports] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [chatVisibility, setChatVisibility] = useState({});

  const loadSupports = () => {
    fetch(`${base_url}/admin/support`)
      .then((res) => res.json())
      .then((data) => setSupports(data))
      .catch((err) => console.error("Error fetching support list:", err));
  };

  useEffect(() => {
    loadSupports();
    const interval = setInterval(loadSupports, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleChatClick = (supportId) => {
    if (!activeChats.includes(supportId)) {
      setActiveChats([...activeChats, supportId]);
    }
    setChatVisibility((prev) => ({ ...prev, [supportId]: true }));
    fetch(`${base_url}/schat/mark-read/${supportId}`, { method: "POST" })
      .then((res) => res.json())
      .then(() => {
        setSupports((prev) =>
          prev.map((s) => s._id === supportId ? { ...s, unreadCount: 0 } : s)
        );
      })
      .catch((err) => console.error("Error marking messages as read:", err));
  };

  const closeChat = (supportId) => {
  setActiveChats((prev) => prev.filter((id) => id !== supportId));
  setChatVisibility((prev) => {
    const updated = { ...prev };
    delete updated[supportId];
    return updated;
  });
};


  const toggleChatVisibility = (supportId) => {
    setChatVisibility((prev) => ({ ...prev, [supportId]: !prev[supportId] }));
  };

  return (
    <div className="w-full">
      <div className="hdr">Support Chat</div>

      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 border-b">#</th>
              <th className="px-4 py-3 border-b">Support ID (Email)</th>
              <th className="px-4 py-3 border-b">Business Name</th>
              <th className="px-4 py-3 border-b">Last Message</th>
              <th className="px-4 py-3 border-b">Last Updated</th>
              <th className="px-4 py-3 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {supports.length > 0 ? (
              supports.map((chat, index) => (
                <tr key={chat._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">{chat._id}</td>
                  <td className="px-4 py-3">{chat.bName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {chat.lastMessage ? chat.lastMessage.slice(0, 50) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {chat.lastTime ? new Date(chat.lastTime).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="relative flex items-center gap-1 bg-blue-300 hover:bg-blue-400
                        text-black px-3 py-1 rounded text-xs"
                      onClick={() => handleChatClick(chat._id)}
                    >
                      Chat <MdChat />
                      {chat.unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white
                          text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No chats found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden flex flex-col gap-3">
        {supports.length > 0 ? (
          supports.map((chat, index) => (
            <div
              key={chat._id}
              className="border rounded-xl shadow-sm bg-white p-4 flex flex-col gap-2"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-gray-400 flex-shrink-0">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {chat.bName || "—"}
                  </span>
                </div>
                <button
                  className="relative flex items-center gap-1 bg-blue-300 hover:bg-blue-400
                    text-black px-3 py-1.5 rounded-lg text-xs flex-shrink-0"
                  onClick={() => handleChatClick(chat._id)}
                >
                  Chat <MdChat size={14} />
                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white
                      text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* ID */}
              <p className="text-xs text-gray-400 truncate">
                <span className="font-medium text-gray-500">ID: </span>{chat._id}
              </p>

              {/* Last message */}
              {chat.lastMessage && (
                <div className="flex items-start gap-1.5 text-xs text-gray-500">
                  <MdMessage size={13} className="mt-0.5 flex-shrink-0 text-gray-400" />
                  <span className="line-clamp-2">{chat.lastMessage}</span>
                </div>
              )}

              {/* Last updated */}
              {chat.lastTime && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MdAccessTime size={13} className="flex-shrink-0" />
                  <span>{new Date(chat.lastTime).toLocaleString()}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-gray-500 text-sm">No chats found</p>
        )}
      </div>

      {/* ── Floating chat boxes ── */}
     <div className="fixed right-0 bottom-0 p-2 md:p-4
  flex flex-row-reverse items-end gap-1.5 md:gap-2">
  {activeChats.map((supportId) => {
    const chatData = supports.find((c) => c._id === supportId);
    return (
      <div key={supportId} className="flex-shrink-0
        w-[calc(100vw-16px)] max-w-[320px] md:w-72">
        <Schat
          key={supportId}
          supportId={supportId}
          bId={chatData?.bId}
          bName={chatData?.bName}
          isVisible={chatVisibility[supportId]}
          onClose={() => closeChat(supportId)}
          onToggle={() => toggleChatVisibility(supportId)}
        />
      </div>
    );
  })}
</div>
    </div>
  );
};

export default AdminSupport;