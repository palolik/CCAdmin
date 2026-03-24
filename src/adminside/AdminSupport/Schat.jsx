/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import { MdClose } from "react-icons/md";
import { TiArrowMinimise } from "react-icons/ti";
import { base_url, chat_url } from "../../config/config";

const SeenLabel = ({ read }) => (
  read
    ? <span className="text-[10px] text-blue-500 mt-0.5">Seen</span>
    : <span className="text-[10px] text-gray-400 mt-0.5">Sent</span>
);

const Schat = ({ supportId, bId, bName, onClose, isVisible, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);
  const isVisibleRef = useRef(false); // ✅ ref to avoid stale closure in WebSocket

  // Sync ref with prop + mark read when chat becomes visible
  useEffect(() => {
    isVisibleRef.current = isVisible;
    if (isVisible && supportId) markMessagesRead();
  }, [isVisible, supportId]);

  // Mark user's messages as read (only called when chat is visible)
  const markMessagesRead = async () => {
    if (!supportId) return;
    try {
      await fetch(`${base_url}/schat/mark-read/${supportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "user" }), // mark user's msgs as read
      });
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Polling for messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${base_url}/schat/${supportId}`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching support chat:", err);
      }
    };

    if (supportId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 1000);
      return () => clearInterval(interval);
    }
  }, [supportId]);

  // WebSocket setup
  useEffect(() => {
    if (!supportId) return;

    const ws = new WebSocket(`${chat_url}`);
    setSocket(ws);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // ✅ Ignore the initial array dump on connect
  if (Array.isArray(data)) return;

  if (data.supportId === supportId) {
    setMessages((prev) => {
      if (!prev.some((m) => m.time === data.time && m.text === data.text)) {
        return [...prev, data];
      }
      return prev;
    });

    // ✅ Only mark read if chat window is actually visible
    if (isVisibleRef.current) markMessagesRead();
  }
};
    ws.onerror = (err) => console.error("WebSocket error:", err);
    return () => ws.close();
  }, [supportId]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const message = {
      supportId,
      bId,
      bName,
      sender: "manager",
      text: inputValue,
      time: new Date().toISOString(),
      read: false,
    };

    setIsSending(true);
    try {
      await fetch(`${base_url}/addschat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      socket?.send(JSON.stringify(message));
      setMessages((prev) => [...prev, message]);
      setInputValue("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col mx-2 border border-blue-300 bg-white rounded-t-lg shadow-lg">
      <div className="flex items-center justify-between bg-blue-100 p-2 rounded-t-lg">
        <p className="font-semibold text-sm">{bName || "Client Chat"}</p>
        <div className="flex gap-2">
          <TiArrowMinimise
            className="h-5 w-5 text-gray-600 hover:text-blue-500 cursor-pointer"
            onClick={onToggle}
          />
          <MdClose
            className="h-5 w-5 text-gray-600 hover:text-red-500 cursor-pointer"
            onClick={onClose}
          />
        </div>
      </div>

      {isVisible && (
        <>
          <div className="h-[400px] overflow-y-auto p-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex mb-2 ${msg.sender === "manager" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-2 rounded-xl max-w-xs ${
                    msg.sender === "manager" ? "bg-blue-200 text-right" : "bg-gray-200 text-left"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <p className="text-[10px] text-gray-500">
                      {new Date(msg.time).toLocaleTimeString()}
                    </p>
                    {/* ✅ Only show on manager's own messages */}
                    {msg.sender === "manager" && <SeenLabel read={msg.read} />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex border-t">
            <input
              type="text"
              className="flex-grow p-2 outline-none text-sm"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 text-sm rounded-r"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Schat;