import { useEffect, useState } from "react";
import { MdChat } from "react-icons/md";
import Schat from "./Schat";
import { base_url } from "../../config/config";
const AdminSupport = () => {
  const [supports, setSupports] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [chatVisibility, setChatVisibility] = useState({});

  const loadSupports = () => {
    fetch(`${base_url}/admin/support`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Support data:", data);
        setSupports(data);
      })
      .catch((err) => console.error("Error fetching support list:", err));
  };

  useEffect(() => {
    loadSupports();
    // Optional: auto-refresh unread counts every 10s
    const interval = setInterval(loadSupports, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleChatClick = (supportId) => {
    if (!activeChats.includes(supportId)) {
      setActiveChats([...activeChats, supportId]);
    }

    setChatVisibility((prev) => ({
      ...prev,
      [supportId]: true,
    }));

    // Mark as read
    fetch(`${base_url}/schat/mark-read/${supportId}`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then(() => {
        setSupports((prev) =>
          prev.map((s) =>
            s._id === supportId ? { ...s, unreadCount: 0 } : s
          )
        );
      })
      .catch((err) => console.error("Error marking messages as read:", err));
  };

  const closeChat = (supportId) => {
    setChatVisibility((prev) => ({
      ...prev,
      [supportId]: false,
    }));
  };

  const toggleChatVisibility = (supportId) => {
    setChatVisibility((prev) => ({
      ...prev,
      [supportId]: !prev[supportId],
    }));
  };

  return (
      <div className="w-full">
            <div className="hdr">Support Chat</div>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
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
                    {chat.lastMessage ? chat.lastMessage.slice(0, 50) : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {chat.lastTime
                      ? new Date(chat.lastTime).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="relative flex items-center gap-1 bg-blue-300 hover:bg-blue-400 text-black px-3 py-1 rounded text-xs"
                      onClick={() => handleChatClick(chat._id)}
                    >
                      Chat <MdChat />
                      {chat.unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
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

      {/* Floating Chat Boxes */}
      <div className="flex flex-row-reverse items-end fixed right-0 bottom-0 p-4 gap-2">
        {activeChats.map((supportId) => {
          const chatData = supports.find((c) => c._id === supportId);
          return (
            <Schat
              key={supportId}
              supportId={supportId}
              bId={chatData?.bId}
              bName={chatData?.bName}
              isVisible={chatVisibility[supportId]}
              onClose={() => closeChat(supportId)}
              onToggle={() => toggleChatVisibility(supportId)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AdminSupport;
